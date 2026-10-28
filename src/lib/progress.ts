/** Pure progress rules. Nothing here touches storage or React. */
import { coreEpisodes, finalQuiz, getEpisode, episodesInPart, partQuizzes, quizForPart } from '@/data'
import type { CourseData, Episode, Quiz } from '@/data/types'
import { isPassingScore, type CertificateRecord, type Progress } from './schema'

export function isEpisodeComplete(p: Progress, episodeId: number): boolean {
  return p.completedEpisodes.includes(episodeId)
}

export function setEpisodeComplete(p: Progress, episodeId: number, done: boolean): Progress {
  const without = p.completedEpisodes.filter((id) => id !== episodeId)
  return { ...p, completedEpisodes: done ? [...without, episodeId] : without }
}

export function isStepDone(p: Progress, labId: string, stepId: string): boolean {
  return p.labSteps[labId]?.includes(stepId) ?? false
}

export function setStepDone(p: Progress, labId: string, stepId: string, done: boolean): Progress {
  const current = (p.labSteps[labId] ?? []).filter((id) => id !== stepId)
  const next = done ? [...current, stepId] : current
  const labSteps = { ...p.labSteps }
  if (next.length > 0) labSteps[labId] = next
  else delete labSteps[labId]
  return { ...p, labSteps }
}

export function resetLab(p: Progress, labId: string): Progress {
  const labSteps = { ...p.labSteps }
  delete labSteps[labId]
  return { ...p, labSteps }
}

export function labStepCount(p: Progress, labId: string): number {
  return p.labSteps[labId]?.length ?? 0
}

export type LabStatus = 'not-started' | 'in-progress' | 'done'

export function labStatus(p: Progress, labId: string, totalSteps: number): LabStatus {
  const done = labStepCount(p, labId)
  if (done === 0) return 'not-started'
  return done >= totalSteps ? 'done' : 'in-progress'
}

export function recordQuiz(p: Progress, quiz: Quiz, correct: number): Progress {
  const total = quiz.questions.length
  const score = Math.max(0, Math.min(total, Math.floor(correct)))
  const previous = p.quizzes[quiz.id]
  const best = Math.max(previous?.best ?? 0, score)
  return {
    ...p,
    quizzes: {
      ...p.quizzes,
      [quiz.id]: {
        best,
        last: score,
        attempts: (previous?.attempts ?? 0) + 1,
        passed: isPassingScore(best, total, quiz.passMark),
      },
    },
  }
}

export function isQuizPassed(p: Progress, quizId: string): boolean {
  return p.quizzes[quizId]?.passed ?? false
}

/** Part quizzes the learner still has to pass before the final unlocks. */
export function quizzesBlockingFinal(p: Progress, data: CourseData): Quiz[] {
  return partQuizzes(data).filter((q) => !isQuizPassed(p, q.id))
}

export function isQuizUnlocked(p: Progress, data: CourseData, quiz: Quiz): boolean {
  return quiz.partId !== 'final' || quizzesBlockingFinal(p, data).length === 0
}

export type Requirement =
  | { kind: 'episode'; episode: Episode }
  | { kind: 'quiz'; quiz: Quiz }
  | { kind: 'final'; quiz: Quiz }

/** Every unmet certificate requirement, in course order. Empty list = eligible. */
export function certificateEligibility(p: Progress, data: CourseData): Requirement[] {
  const unmet: Requirement[] = []
  for (const m of coreEpisodes(data)) {
    if (!isEpisodeComplete(p, m.id)) unmet.push({ kind: 'episode', episode: m })
  }
  for (const q of partQuizzes(data)) {
    if (!isQuizPassed(p, q.id)) unmet.push({ kind: 'quiz', quiz: q })
  }
  const final = finalQuiz(data)
  if (final && !isQuizPassed(p, final.id)) unmet.push({ kind: 'final', quiz: final })
  return unmet
}

export function isEligible(p: Progress, data: CourseData): boolean {
  return certificateEligibility(p, data).length === 0
}

/** The stored certificate, shown only while the learner still meets every requirement. */
export function visibleCertificate(p: Progress, data: CourseData): CertificateRecord | null {
  return p.certificate && isEligible(p, data) ? p.certificate : null
}

export type NextStep =
  | { kind: 'episode'; episode: Episode }
  | { kind: 'quiz'; quiz: Quiz }
  | { kind: 'final'; quiz: Quiz }
  | { kind: 'certificate' }
  | { kind: 'done' }

export function nextStep(p: Progress, data: CourseData): NextStep {
  for (const part of data.parts) {
    if (part.optional) continue
    const pending = episodesInPart(data, part.id).find((m) => !m.optional && !isEpisodeComplete(p, m.id))
    if (pending) return { kind: 'episode', episode: pending }
    const quiz = quizForPart(data, part.id)
    if (quiz && !isQuizPassed(p, quiz.id)) return { kind: 'quiz', quiz }
  }
  const final = finalQuiz(data)
  if (final && !isQuizPassed(p, final.id)) return { kind: 'final', quiz: final }
  if (!visibleCertificate(p, data)) return { kind: 'certificate' }
  return { kind: 'done' }
}

export function coreProgress(p: Progress, data: CourseData): { done: number; total: number } {
  const core = coreEpisodes(data)
  const done = core.filter((m) => isEpisodeComplete(p, m.id)).length
  return { done, total: core.length }
}

export function hasAnyProgress(p: Progress): boolean {
  return (
    p.completedEpisodes.length > 0 ||
    Object.keys(p.labSteps).length > 0 ||
    Object.keys(p.quizzes).length > 0
  )
}

export function episodeNeighbours(
  data: CourseData,
  episodeId: number,
): { previous: Episode | undefined; next: Episode | undefined } {
  const index = data.episodes.findIndex((m) => m.id === episodeId)
  return {
    previous: index > 0 ? data.episodes[index - 1] : undefined,
    next: index >= 0 && index < data.episodes.length - 1 ? data.episodes[index + 1] : undefined,
  }
}

/** True when this episode is the last one of its part. */
export function isLastInPart(data: CourseData, episodeId: number): boolean {
  const m = getEpisode(data, episodeId)
  if (!m) return false
  const inPart = episodesInPart(data, m.partId)
  return inPart[inPart.length - 1]?.id === m.id
}

/** Where the main call to action goes for a signed-in learner. */
export function nextStepHref(step: NextStep): string {
  switch (step.kind) {
    case 'episode':
      return `/learn/${step.episode.id}`
    case 'quiz':
    case 'final':
      return `/quiz/${step.quiz.id}`
    default:
      return '/certificate'
  }
}
