/*
 * TODO(content): PLACEHOLDER DATA. Replace every entry below with the real course.
 *
 * The course is a short video series (about 12 episodes of 6-9 minutes, grouped into parts). Nothing
 * here is real course material: titles, summaries, outcomes, durations, chapters and notes are generic
 * placeholders so every page and state can render and be tested. To add the real videos, follow
 * docs/ADDING-VIDEOS.md.
 *
 * Shape (see src/data/types.ts for field-by-field docs):
 *   course    CourseInfo  title, level, summary, instructor, instructorOrg, requirements[], notice?
 *   parts     Part[]      { id, title, outcome, optional?, motif?, theme? }  optional parts are not required
 *   episodes  Episode[]   { id, number, partId, title, summary, durationSec, durationApprox?, videos{lang: mp4},
 *                           captions{lang: vtt}, poster?, chapters?[{t, label}], resources?[{label, href, kind}],
 *                           notes?[], labId?, quizAfter?, optional? }
 *                         array order = course order; id is the /learn/<id> URL
 *
 * Rules (checked by validateCourseData in src/data/validate.ts):
 *   - part and episode ids are unique; every episode.partId exists; episode numbers are unique
 *   - every episode.labId exists in labs.ts and that lab points back to the episode
 *   - each part has at most one quiz in quizzes.ts, and there is at most one final
 */
import type { CourseInfo, Episode, Part } from './types'

/** Set to false once this file holds real content (stops the dev-console placeholder warning). */
export const IS_PLACEHOLDER = true

export const course: CourseInfo = {
  title: 'Amazon Bedrock for Beginners',
  level: 'Beginner',
  summary: 'A beginner video course on Amazon Bedrock in 12 episodes, from the console tour to calling a model from your own code.',
  instructor: 'Vishwaanth',
  instructorOrg: 'AI Workboard',
  requirements: ['Requirement 1 goes here.', 'Requirement 2 goes here.'],
}

/** Part names and outcomes: the syllabus part headings and their "Learners finish Part N able to ..." lines. */
export const parts: Part[] = [
  {
    id: 1,
    title: 'Foundations',
    outcome: 'Find your way around the Bedrock console and say what Bedrock does that calling each AI provider directly does not.',
    motif: 'console',
    theme: 'ocean',
  },
  {
    id: 2,
    title: 'Text models',
    outcome: 'Run a prompt, read its cost signals, tune its randomness and pick between two models with evidence.',
    motif: 'text',
    theme: 'midnight',
  },
  {
    id: 3,
    title: 'Images and video',
    outcome:
      'Generate and edit images, make a short video, check an image for an AI watermark, and turn any playground action into an API call.',
    motif: 'media',
    theme: 'sunrise',
  },
  {
    id: 4,
    title: 'Safety',
    outcome: 'Build, test and version a guardrail that filters both what users send and what models return.',
    motif: 'shield',
    theme: 'slate',
  },
  {
    id: 5,
    title: 'Building',
    outcome: 'Call a Bedrock model from your own code and keep a record of every request.',
    motif: 'code',
    theme: 'forest',
  },
]

/**
 * The video production catalog: 12 episodes, [partId, title, syllabus modules, seconds, real length?].
 * Lengths are the catalog targets (shown as approximate) until a real video gives the measured length.
 */
const CATALOG: [number, string, string, number, boolean][] = [
  [1, 'Welcome to Amazon Bedrock', 'Modules 0 and 1: Console tour and model access; What Amazon Bedrock is', 441, true],
  [1, 'The model catalog', 'Module 2: The model catalog', 386, true],
  [2, 'Your first prompt: playground and tokens', 'Module 3: Chat playground and tokens', 480, false],
  [2, 'Tuning the answer: temperature and top-P', 'Module 4: Inference parameters', 360, false],
  [2, 'Picking a model: compare mode', 'Module 5: Comparing models', 360, false],
  [3, 'Images: generate, edit, call the API', 'Module 6: Image generation and editing', 540, false],
  [3, 'Video generation and watermark detection', 'Modules 7 and 8: Video generation; Watermark detection', 420, false],
  [4, 'Guardrails I: filters, attacks, topics', 'Module 9: Guardrails, steps 1 to 3', 480, false],
  [4, 'Guardrails II: words, PII, grounding, testing', 'Module 9: Guardrails, steps 4 to 7', 480, false],
  [5, 'Agents, knowledge bases and custom models', 'Module 10: Agents, knowledge bases, fine-tuning', 480, false],
  [5, 'Calling Bedrock from code', 'Module 11: Calling Bedrock from code', 540, false],
  [5, "Logging, monitoring and what's next", 'Modules 12 and 13: Logging and monitoring; Beyond the basics', 480, false],
]

export const episodes: Episode[] = CATALOG.map(([partId, title, summary, durationSec, measured], i) => {
  const n = i + 1
  const episode: Episode = {
    id: n,
    number: n,
    partId,
    title,
    summary,
    durationSec,
    durationApprox: measured ? undefined : true,
    videos: {},
    captions: {},
  }
  return episode
})

// Placeholder extras so every optional field and note kind renders somewhere.
Object.assign(episodes[0]!, {
  labId: 'lab-1',
  chapters: [
    { t: 0, label: 'Chapter 1' },
    { t: 120, label: 'Chapter 2' },
    { t: 300, label: 'Chapter 3' },
  ],
  resources: [
    { label: 'Resource link goes here', href: 'https://aws.amazon.com/bedrock/', kind: 'link' },
    { label: 'Download goes here', href: '/videos/README.txt', kind: 'download' },
  ],
  notes: [
    { kind: 'p', text: 'Notes go here. This paragraph is a placeholder.' },
    { kind: 'list', items: ['Point 1 goes here.', 'Point 2 goes here.'] },
    { kind: 'callout', tone: 'info', title: 'Note title', text: 'An information callout goes here.' },
  ],
} satisfies Partial<Episode>)

Object.assign(episodes[2]!, {
  notes: [
    { kind: 'steps', items: ['Step 1 goes here.', 'Step 2 goes here.'] },
    {
      kind: 'table',
      caption: 'Table caption goes here',
      columns: ['Column 1', 'Column 2'],
      rows: [
        ['Row 1, cell 1', 'Row 1, cell 2'],
        ['Row 2, cell 1', 'Row 2, cell 2'],
      ],
    },
  ],
} satisfies Partial<Episode>)

Object.assign(episodes[9]!, {
  labId: 'lab-2',
  notes: [
    { kind: 'code', lang: 'text', label: 'Example code block', code: 'Code sample goes here.' },
    { kind: 'callout', tone: 'caution', title: 'Caution title', text: 'A caution callout goes here.' },
  ],
} satisfies Partial<Episode>)
