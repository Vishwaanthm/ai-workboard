import type { CourseData } from './types'

/** Checks the rules that tie the data files together. Returns a list of problems (empty = valid). */
export function validateCourseData(data: CourseData): string[] {
  const errors: string[] = []
  const dup = <T,>(values: T[]) => values.filter((v, i) => values.indexOf(v) !== i)

  for (const id of dup(data.episodes.map((m) => m.id))) errors.push(`Duplicate episode id ${id}`)
  for (const id of dup(data.labs.map((l) => l.id))) errors.push(`Duplicate lab id ${id}`)
  for (const id of dup(data.quizzes.map((q) => q.id))) errors.push(`Duplicate quiz id ${id}`)

  for (const m of data.episodes) {
    if (!Number.isInteger(m.id) || m.id < 0) errors.push(`Episode id ${m.id} must be a non-negative integer`)
    if (m.outcomes.length === 0) errors.push(`Episode ${m.id} needs at least one outcome`)
    if (m.check && !(m.check.question.trim() && m.check.answer.trim())) {
      errors.push(`Episode ${m.id} check needs a question and an answer`)
    }
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

  const finals = data.quizzes.filter((q) => q.episodeId === 'final')
  if (finals.length > 1) errors.push(`Expected at most one final quiz, found ${finals.length}`)

  for (const e of data.episodes) {
    const count = data.quizzes.filter((q) => q.episodeId === e.id).length
    if (count > 1) errors.push(`Episode ${e.id} has ${count} quizzes; at most one is allowed`)
  }

  for (const e of data.episodes) {
    if (!Number.isFinite(e.durationSec) || e.durationSec < 0) errors.push(`Episode ${e.id} needs a durationSec >= 0`)
    if (e.quizAfter && !data.quizzes.some((q) => q.id === e.quizAfter)) {
      errors.push(`Episode ${e.id} quizAfter points to unknown quiz "${e.quizAfter}"`)
    }
    const chapters = e.chapters ?? []
    for (const c of chapters) {
      if (c.t !== undefined && !(c.t >= 0 && c.t <= e.durationSec)) {
        errors.push(`Episode ${e.id} chapter "${c.label}" is outside the episode`)
      }
    }
    const timed = chapters.filter((c) => c.t !== undefined).length
    if (timed > 0 && timed < chapters.length) errors.push(`Episode ${e.id} gives start times for some chapters only`)
  }

  for (const quiz of data.quizzes) {
    if (!/^[a-z0-9-]+$/.test(quiz.id)) errors.push(`Quiz id "${quiz.id}" must be a lowercase slug`)
    if (quiz.episodeId !== 'final' && !data.episodes.some((e) => e.id === quiz.episodeId)) {
      errors.push(`Quiz "${quiz.id}" has unknown episode ${quiz.episodeId}`)
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
