/*
 * TODO(content): PARTLY PLACEHOLDER DATA. The episode list follows the production catalog (v2); the
 * remaining placeholders are marked below.
 *
 * Source: the "Amazon Bedrock Course (vijay-ttv) - Production Catalog" (local copy: docs/catalog-v2.md).
 * Titles, "Covers" lines (summary), "Learner can" lists (outcomes), "Ends with" checks, themes, E01's
 * chapter names and E01's measured length come from the catalog, trimmed or re-cased for the UI only.
 * Still placeholder: E02 to E05 chapter names ("Chapter 1" to "Chapter 4"), requirements, resources and
 * notes. The course content itself is the videos: never write lesson notes here. To add the real
 * videos, follow docs/ADDING-VIDEOS.md.
 *
 * Shape (see src/data/types.ts for field-by-field docs):
 *   course    CourseInfo  title, level, summary, instructor, instructorOrg, requirements[], notice?
 *   episodes  Episode[]   { id, number, title, summary, outcomes[], check?{question, answer}, theme?, cover?,
 *                           services?[], durationSec, durationApprox?, videos{lang: mp4}, captions{lang: vtt},
 *                           poster?, chapters?[{t?, label}], resources?[{label, href, kind}], notes?[],
 *                           labId?, quizAfter?, optional? }
 *                         array order = course order; id is the /learn/<id> URL
 *   chapters  leave `t` out until a video gives the start times: chapters are then listed without seek times
 *
 * Rules (checked by validateCourseData in src/data/validate.ts):
 *   - episode ids and numbers are unique; chapter times (when given) fall inside the episode
 *   - every episode.labId exists in labs.ts and that lab points back to the episode
 *   - each episode has at most one quiz in quizzes.ts, and there is at most one final
 */
import type { Chapter, CourseInfo, Episode } from './types'

/** Set to false once this file holds real content (stops the dev-console placeholder warning). */
export const IS_PLACEHOLDER = true

export const course: CourseInfo = {
  title: 'Amazon Bedrock for Beginners',
  level: 'Beginner',
  summary: '5 course videos, about 100 minutes in total. Each video runs 20 to 25 minutes, split into 4 chapters.',
  instructor: 'Vishwaanth',
  instructorOrg: 'AI Workboard',
  requirements: ['Requirement 1 goes here.', 'Requirement 2 goes here.'],
  notice: 'The videos are in English first. Spanish, Hindi and Tamil may follow later.',
}

/** Placeholder chapter names until the catalog names them (no start times yet). */
const placeholderChapters = (): Chapter[] => [1, 2, 3, 4].map((n) => ({ label: `Chapter ${n}` }))

export const episodes: Episode[] = [
  {
    id: 1,
    number: 1,
    title: 'Welcome to Amazon Bedrock',
    summary: 'What Bedrock is, ways to pay and get in, the console, the model menu',
    outcomes: [
      'Explain Bedrock in one sentence',
      'Pick on-demand vs batch vs provisioned',
      'Find a model in the catalog and read its card',
      'Choose a kind of model for a job',
    ],
    check: { question: 'Which kind of model would power document search?', answer: 'An embedding model.' },
    theme: 'glass',
    cover: 'entrance',
    services: ['bedrock'],
    // Measured length of the finished video (16:16).
    durationSec: 976,
    videos: {},
    captions: {},
    chapters: [
      { label: 'What Bedrock is' },
      { label: 'Paying and getting in' },
      { label: 'The console map' },
      { label: 'The model menu' },
    ],
    labId: 'lab-1',
  },
  {
    id: 2,
    number: 2,
    title: 'Talking to a model',
    summary: 'Chat playground, tokens and cost, temperature and top P, compare mode, prompt habits',
    outcomes: [
      'Read the three numbers under an answer',
      'Set the dials for facts vs stories',
      'Rewrite a vague prompt into a clear one',
    ],
    check: { question: 'Your app writes legal summaries: high or low temperature?', answer: 'Low.' },
    theme: 'midnight',
    cover: 'typing',
    services: ['bedrock', 'nova'],
    durationSec: 21 * 60,
    durationApprox: true,
    videos: {},
    captions: {},
    chapters: placeholderChapters(),
    // Placeholder extras so every optional field and note kind renders somewhere.
    resources: [
      { label: 'Resource link goes here', href: 'https://aws.amazon.com/bedrock/', kind: 'link' },
      { label: 'Download goes here', href: '/videos/README.txt', kind: 'download' },
    ],
    notes: [
      { kind: 'p', text: 'Notes go here. This paragraph is a placeholder.' },
      { kind: 'list', items: ['Point 1 goes here.', 'Point 2 goes here.'] },
      { kind: 'callout', tone: 'info', title: 'Note title', text: 'An information callout goes here.' },
    ],
  },
  {
    id: 3,
    number: 3,
    title: 'Pictures and video',
    summary: 'Image playground, editing, video jobs, watermark detection',
    outcomes: ['Write a good image prompt', 'Choose the right edit', 'Explain why video runs as a job'],
    check: { question: 'Need a new background behind a product photo?', answer: 'Outpainting.' },
    theme: 'sunrise',
    cover: 'plated',
    services: ['nova', 's3'],
    durationSec: 20 * 60,
    durationApprox: true,
    videos: {},
    captions: {},
    chapters: placeholderChapters(),
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
  },
  {
    id: 4,
    number: 4,
    title: 'Guardrails',
    summary:
      'Content and prompt-attack filters, denied topics, word and PII filters, grounding, testing, ApplyGuardrail',
    outcomes: ['Design a guardrail for an app and test it', 'Explain why a request was blocked'],
    check: { question: 'A user types their home address: which filter hides it?', answer: 'Sensitive information.' },
    theme: 'slate',
    cover: 'lock',
    services: ['bedrock', 'iam'],
    durationSec: 22 * 60,
    durationApprox: true,
    videos: {},
    captions: {},
    chapters: placeholderChapters(),
  },
  {
    id: 5,
    number: 5,
    title: "From console to code, and what's next",
    summary: 'Converse vs InvokeModel, a Lambda app, streaming, logging, cost, knowledge bases and agents',
    outcomes: ['Call a model from code', 'Ship a small serverless app', 'Turn on logging'],
    check: { question: 'Your app must show words as they appear: which call?', answer: 'ConverseStream.' },
    theme: 'forest',
    cover: 'code',
    services: ['lambda', 'apiGateway', 'cloudwatch', 's3'],
    durationSec: 21 * 60,
    durationApprox: true,
    videos: {},
    captions: {},
    chapters: placeholderChapters(),
    labId: 'lab-2',
    notes: [
      { kind: 'code', lang: 'text', label: 'Example code block', code: 'Code sample goes here.' },
      { kind: 'callout', tone: 'caution', title: 'Caution title', text: 'A caution callout goes here.' },
    ],
  },
]
