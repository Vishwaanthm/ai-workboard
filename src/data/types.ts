/**
 * Content types for the course data files (course.ts, labs.ts, quizzes.ts, site.ts).
 * Components read only these shapes, so real content can replace the placeholders
 * without any component changes. Rules that tie the files together (ids, references,
 * one quiz per non-optional part, one final) are checked by src/data/validate.ts.
 */

/** One block of lesson notes. Blocks render in array order. */
export type NoteBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'table'; caption: string; columns: string[]; rows: string[][] }
  | { kind: 'callout'; tone: 'info' | 'caution'; title: string; text: string }
  | { kind: 'code'; lang: CodeLang; label: string; code: string }

/** Official AWS Architecture Icons available in public/aws-icons (see src/components/art/awsIcons.ts). */
export type AwsIconName =
  | 'bedrock'
  | 'nova'
  | 'lambda'
  | 's3'
  | 'cloudwatch'
  | 'iam'
  | 'cli'
  | 'cloudshell'
  | 'lambdaFunction'
  | 's3Bucket'
  | 's3BucketObjects'
  | 'cloudwatchLogs'
  | 'iamRole'
  | 'iamPermissions'
  | 'user'
  | 'client'
  | 'chat'
  | 'documents'
  | 'multimedia'
  | 'internet'
  | 'awsCloudLogo'
  | 'region'

export type CodeLang = 'bash' | 'python' | 'json' | 'javascript' | 'typescript' | 'text'

export interface CourseInfo {
  /** Course name shown in headers, certificate and page titles. */
  title: string
  /** For example "Beginner". */
  level: string
  /** One or two sentences for the Course page and Home course map. */
  summary: string
  instructor: string
  instructorOrg: string
  /** Bullet list under "Before you start" on the Course page. */
  requirements: string[]
  /** Optional caveat shown as a callout on the Course page and the first lesson. */
  notice?: string
}

/** Selects the small original illustration drawn for a part (see src/components/art/PartMotif.tsx). */
export type PartMotifName = 'console' | 'text' | 'media' | 'shield' | 'code' | 'explore'

/** Colour theme from the video production catalog; selects the part's accent and cover image. */
export type PartTheme = 'ocean' | 'midnight' | 'sunrise' | 'slate' | 'forest' | 'aurora'

export interface Part {
  /** Unique positive integer. Used in anchors (#part-<id>). */
  id: number
  title: string
  /** "You will be able to..." sentence, shown under "What you'll learn". */
  outcome: string
  /** Optional parts are not needed for the certificate and have no quiz. */
  optional?: boolean
  /** Illustration for this part; a neutral default is used when omitted. */
  motif?: PartMotifName
  /** Catalog colour theme (accent + cover photo); a neutral default is used when omitted. */
  theme?: PartTheme
}

/** Video languages the course is produced in. */
export type Lang = 'en' | 'es' | 'hi' | 'ta'

export interface Chapter {
  /** Start time in seconds. */
  t: number
  label: string
}

export interface Resource {
  label: string
  /** Absolute URL, or a path under public/ such as /videos/e01/slides.pdf. */
  href: string
  kind: 'link' | 'download'
}

/** One video episode (lesson). Files go under public/videos/; see docs/ADDING-VIDEOS.md. */
export interface Episode {
  /** Unique non-negative integer. Used in the URL: /learn/<id>. */
  id: number
  /** Episode number shown as E01, E02, ... */
  number: number
  /** Must match a Part id. */
  partId: number
  title: string
  /** One line shown in the curriculum. */
  summary: string
  /** Running time in seconds (used for totals before the video file loads). */
  durationSec: number
  /** True while durationSec is the catalog target, not a measured length: shown as "≈ 8 min". */
  durationApprox?: boolean
  /** Video file per language. Empty until the videos exist: the page shows "Video coming soon". */
  videos: Partial<Record<Lang, string>>
  /** WebVTT caption file per language. */
  captions: Partial<Record<Lang, string>>
  /** Poster image shown before playback. */
  poster?: string
  chapters?: Chapter[]
  /** Links and downloads shown under the video. */
  resources?: Resource[]
  /** Optional short notes shown under the video. */
  notes?: NoteBlock[]
  /** Must match a Lab id when the episode has a lab. */
  labId?: string
  /** Quiz id to offer after this episode (defaults to the part quiz on the part's last episode). */
  quizAfter?: string
  /** Optional episodes are not needed for the certificate. */
  optional?: boolean
}

export interface LabCode {
  lang: CodeLang
  /** Short caption above the code, also used as the code region's accessible name. */
  label: string
  code: string
}

export interface LabStep {
  /** Unique within the lab. Stored in progress, so keep ids stable once published. */
  id: string
  title: string
  detail: string
  /** Optional warning shown as a caution callout above the step detail. */
  caution?: string
  code?: LabCode
}

export interface Lab {
  /** URL slug: /labs/<id>. Stored in progress, so keep ids stable once published. */
  id: string
  /** Must match a Episode id. */
  episodeId: number
  title: string
  tags: string[]
  objectives: string[]
  prerequisites: string[]
  costNote: string
  steps: LabStep[]
  /** What the learner should see when they are done. */
  expected: string
  /** Shows an "Untested" callout on the lab page. */
  untested?: boolean
  /** AWS services used, shown as official icons on the lab card and header. */
  services?: AwsIconName[]
}

export interface QuizQuestion {
  /** Unique within the quiz. */
  id: string
  prompt: string
  /** 2 to 6 options. */
  options: string[]
  /** Zero-based index into options. */
  answerIndex: number
  /** Shown after submit. */
  explanation: string
  /** Optional link back to the episode that teaches this. */
  episodeId?: number
}

export interface Quiz {
  /** URL slug: /quiz/<id>. Stored in progress, so keep ids stable once published. */
  id: string
  /** A non-optional Part id, or 'final' for the final assessment (exactly one). */
  partId: number | 'final'
  title: string
  /** Fraction of correct answers needed to pass, 0 < passMark <= 1. Default 0.8. */
  passMark?: number
  questions: QuizQuestion[]
}

export interface SiteCopy {
  hero: { title: string; subtitle: string }
  labsBlurb: { title: string; text: string }
  instructorBio: string
}

export interface CourseData {
  course: CourseInfo
  parts: Part[]
  episodes: Episode[]
  labs: Lab[]
  quizzes: Quiz[]
}
