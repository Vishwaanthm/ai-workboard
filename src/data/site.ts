/*
 * TODO(content): PLACEHOLDER COPY. Replace the subtitle, labs blurb and instructor bio.
 *
 * Marketing strings on the Home and Course pages that depend on the curriculum live here, so the
 * components never invent course facts. Counts (parts, episodes, labs, quizzes) are not written
 * here: the pages compute them from course.ts, labs.ts and quizzes.ts.
 *
 * Shape: SiteCopy (src/data/types.ts)
 *   hero.title       Home h1, keep it under about 8 words so it fits on two lines
 *   hero.subtitle    Home subtext, at most 20 words
 *   labsBlurb        Home labs section heading and one sentence
 *   instructorBio    One or two sentences about the instructor
 */
import type { SiteCopy } from './types'

/** Set to false once this file holds real content (stops the dev-console placeholder warning). */
export const IS_PLACEHOLDER = true

export const site: SiteCopy = {
  hero: {
    title: 'Learn Amazon Bedrock by building with it.',
    subtitle: 'Course subtitle goes here. One sentence, at most 20 words.',
  },
  labsBlurb: {
    title: 'Hands-on labs',
    text: 'Labs description goes here. One sentence about the hands-on work.',
  },
  instructorBio: 'Instructor bio goes here.',
}
