/*
 * TODO(content): PLACEHOLDER DATA. Replace every entry below with the real quizzes.
 *
 * Nothing here is real assessment material. Correct answers are always "Correct answer" so the
 * pass, fail and certificate states can be tested by hand.
 *
 * Shape (see src/data/types.ts):
 *   quizzes  Quiz[]  { id, episodeId: <episode id> | 'final', title, passMark?,
 *                      questions: { id, prompt, options[2..6], answerIndex, explanation, episodeId? }[] }
 *
 * Rules (checked by validateCourseData in src/data/validate.ts):
 *   - at most one quiz per episode, and at most one quiz with episodeId 'final' (quizzes are optional)
 *   - answerIndex is a valid index into options; passMark (default 0.8) is in (0, 1]
 *   - quiz ids are URL slugs (/quiz/<id>); keep them stable once published
 */
import type { Quiz, QuizQuestion } from './types'

/** Set to false once this file holds real content (stops the dev-console placeholder warning). */
export const IS_PLACEHOLDER = true

function placeholderQuestions(episodeIds: number[]): QuizQuestion[] {
  return [1, 2, 3].map((n, i) => ({
    id: `q${n}`,
    prompt: `Question ${n}?`,
    options: ['Correct answer', 'Wrong answer A', 'Wrong answer B', 'Wrong answer C'],
    answerIndex: 0,
    explanation: `Explanation for question ${n} goes here.`,
    episodeId: episodeIds[i % episodeIds.length],
  }))
}

/** One placeholder quiz per episode (offered on that episode's page), then the final assessment. */
export const quizzes: Quiz[] = [
  ...[1, 2, 3, 4, 5].map(
    (n): Quiz => ({
      id: `episode-${n}`,
      episodeId: n,
      title: `E${String(n).padStart(2, '0')} quiz`,
      questions: placeholderQuestions([n]),
    }),
  ),
  {
    id: 'final',
    episodeId: 'final',
    title: 'Final assessment',
    questions: placeholderQuestions([1, 3, 5]),
  },
]
