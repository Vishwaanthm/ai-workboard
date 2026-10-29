import { course, episodes, parts, IS_PLACEHOLDER as coursePlaceholder } from './course'
import { labs, IS_PLACEHOLDER as labsPlaceholder } from './labs'
import { quizzes, IS_PLACEHOLDER as quizzesPlaceholder } from './quizzes'
import { IS_PLACEHOLDER as sitePlaceholder } from './site'
import { IS_PLACEHOLDER as homePlaceholder } from './home'
import type { CourseData, Lab, Episode, Part, Quiz } from './types'

export type { CourseData } from './types'

/** All course content in one object. Components get it from AppState so tests can swap fixtures. */
export const courseData: CourseData = { course, parts, episodes, labs, quizzes }

/** Data files still marked as placeholder content (see the TODO(content) header in each file). */
const placeholderFlags: [boolean, string][] = [
  [coursePlaceholder, 'src/data/course.ts'],
  [labsPlaceholder, 'src/data/labs.ts'],
  [quizzesPlaceholder, 'src/data/quizzes.ts'],
  [sitePlaceholder, 'src/data/site.ts'],
  [homePlaceholder, 'src/data/home.ts'],
]
export const placeholderFiles: string[] = placeholderFlags.filter(([flag]) => flag).map(([, file]) => file)

export function getEpisode(data: CourseData, id: number): Episode | undefined {
  return data.episodes.find((m) => m.id === id)
}

export function getPart(data: CourseData, id: number): Part | undefined {
  return data.parts.find((p) => p.id === id)
}

export function getLab(data: CourseData, id: string): Lab | undefined {
  return data.labs.find((l) => l.id === id)
}

export function getQuiz(data: CourseData, id: string): Quiz | undefined {
  return data.quizzes.find((q) => q.id === id)
}

export function episodesInPart(data: CourseData, partId: number): Episode[] {
  return data.episodes.filter((m) => m.partId === partId)
}

export function quizForPart(data: CourseData, partId: number): Quiz | undefined {
  return data.quizzes.find((q) => q.partId === partId)
}

export function finalQuiz(data: CourseData): Quiz | undefined {
  return data.quizzes.find((q) => q.partId === 'final')
}

export function partQuizzes(data: CourseData): Quiz[] {
  return data.quizzes.filter((q) => q.partId !== 'final')
}

export function labForEpisode(data: CourseData, episodeId: number): Lab | undefined {
  return data.labs.find((l) => l.episodeId === episodeId)
}

/** Episodes needed for the certificate: not optional and not in an optional part. */
export function coreEpisodes(data: CourseData): Episode[] {
  return data.episodes.filter((m) => !m.optional && !getPart(data, m.partId)?.optional)
}

/** The lesson a new learner starts with: the first required episode (else the first episode). */
export function firstLesson(data: CourseData): Episode | undefined {
  return coreEpisodes(data)[0] ?? data.episodes[0]
}

export function isOptionalEpisode(data: CourseData, m: Episode): boolean {
  return Boolean(m.optional || getPart(data, m.partId)?.optional)
}

export function courseCounts(data: CourseData) {
  return {
    parts: data.parts.length,
    episodes: data.episodes.length,
    labs: data.labs.length,
    partQuizzes: partQuizzes(data).length,
    hasFinal: Boolean(finalQuiz(data)),
  }
}

/** Parses a /learn/:episodeId param. Returns undefined for anything that is not a known episode id. */
export function parseEpisodeId(data: CourseData, param: string | undefined): Episode | undefined {
  if (!param || !/^\d+$/.test(param)) return undefined
  return getEpisode(data, Number(param))
}
