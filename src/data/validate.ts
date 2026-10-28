import type { CourseData } from './types'

/** Checks the rules that tie the data files together. Returns a list of problems (empty = valid). */
export function validateCourseData(data: CourseData): string[] {
  const errors: string[] = []
  const dup = <T,>(values: T[]) => values.filter((v, i) => values.indexOf(v) !== i)

  for (const id of dup(data.parts.map((p) => p.id))) errors.push(`Duplicate part id ${id}`)
  for (const id of dup(data.episodes.map((m) => m.id))) errors.push(`Duplicate episode id ${id}`)
  for (const id of dup(data.labs.map((l) => l.id))) errors.push(`Duplicate lab id ${id}`)
  for (const id of dup(data.quizzes.map((q) => q.id))) errors.push(`Duplicate quiz id ${id}`)

  for (const m of data.episodes) {
    if (!Number.isInteger(m.id) || m.id < 0) errors.push(`Episode id ${m.id} must be a non-negative integer`)
    if (!data.parts.some((p) => p.id === m.partId)) errors.push(`Episode ${m.id} has unknown part ${m.partId}`)
    if (m.labId) {
      const lab = data.labs.find((l) => l.id === m.labId)
      if (!lab) errors.push(`Episode ${m.id} points to unknown lab "${m.labId}"`)
      else if (lab.episodeId !== m.id) errors.push(`Lab "${lab.id}" does not point back to episode ${m.id}`)
    }
  }

  for (const lab of data.labs) {
    if (!/^[a-z0-9-]+$/.test(lab.id)) errors.push(`Lab id "${lab.id}" must be a lowercase slug`)
    const owner = data.episodes.find((m) => m.id === lab.episodeId)
    if (!owner) errors.push(`Lab "${lab.id}" has unknown episode ${lab.episodeId}`)
    else if (owner.labId !== lab.id) errors.push(`Episode ${owner.id} does not list lab "${lab.id}"`)
    if (lab.steps.length === 0) errors.push(`Lab "${lab.id}" has no steps`)
    for (const id of dup(lab.steps.map((s) => s.id))) errors.push(`Lab "${lab.id}" has duplicate step ${id}`)
  }

  for (const n of dup(data.episodes.map((e) => e.number))) errors.push(`Duplicate episode number ${n}`)

  const finals = data.quizzes.filter((q) => q.partId === 'final')
  if (finals.length > 1) errors.push(`Expected at most one final quiz, found ${finals.length}`)

  for (const part of data.parts) {
    const count = data.quizzes.filter((q) => q.partId === part.id).length
    if (count > 1) errors.push(`Part ${part.id} has ${count} quizzes; at most one is allowed`)
  }

  for (const e of data.episodes) {
    if (!Number.isFinite(e.durationSec) || e.durationSec < 0) errors.push(`Episode ${e.id} needs a durationSec >= 0`)
    if (e.quizAfter && !data.quizzes.some((q) => q.id === e.quizAfter)) {
      errors.push(`Episode ${e.id} quizAfter points to unknown quiz "${e.quizAfter}"`)
    }
    for (const c of e.chapters ?? []) {
      if (!(c.t >= 0 && c.t <= e.durationSec)) errors.push(`Episode ${e.id} chapter "${c.label}" is outside the episode`)
    }
  }

  for (const quiz of data.quizzes) {
    if (!/^[a-z0-9-]+$/.test(quiz.id)) errors.push(`Quiz id "${quiz.id}" must be a lowercase slug`)
    if (quiz.partId !== 'final' && !data.parts.some((p) => p.id === quiz.partId)) {
      errors.push(`Quiz "${quiz.id}" has unknown part ${quiz.partId}`)
    }
    if (quiz.passMark !== undefined && !(quiz.passMark > 0 && quiz.passMark <= 1)) {
      errors.push(`Quiz "${quiz.id}" passMark must be in (0, 1]`)
    }
    if (quiz.questions.length === 0) errors.push(`Quiz "${quiz.id}" has no questions`)
    for (const id of dup(quiz.questions.map((q) => q.id))) errors.push(`Quiz "${quiz.id}" has duplicate question ${id}`)
    for (const q of quiz.questions) {
      if (q.options.length < 2 || q.options.length > 6) errors.push(`Quiz "${quiz.id}" ${q.id} needs 2 to 6 options`)
      if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
        errors.push(`Quiz "${quiz.id}" ${q.id} answerIndex is out of range`)
      }
      if (q.episodeId !== undefined && !data.episodes.some((m) => m.id === q.episodeId)) {
        errors.push(`Quiz "${quiz.id}" ${q.id} links to unknown episode ${q.episodeId}`)
      }
    }
  }
  return errors
}
