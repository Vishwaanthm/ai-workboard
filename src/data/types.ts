/**
 * Content types for the course data files (course.ts, labs.ts, quizzes.ts, site.ts, home.ts).
 * Components read only these shapes, so real content can replace the placeholders
 * without any component changes. Rules that tie the files together (ids, references,
 * at most one quiz per episode, one final) are checked by src/data/validate.ts.
 *
 * The course is flat: a list of video episodes, each split into chapters (no parts).
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
  | 'kms'
  | 'apiGateway'
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

/**
 * Colour theme from the video production catalog; selects the episode's accent (decorative only, the
 * episode code and title are always written next to it).
 */
export type EpisodeTheme = 'glass' | 'midnight' | 'sunrise' | 'slate' | 'forest'

/** Cover photos in public/media/ (see src/components/media/covers.ts and CREDITS.md). */
export type CoverName = 'entrance' | 'typing' | 'plated' | 'lock' | 'code'

/** Video languages the course is produced in. */
export type Lang = 'en' | 'es' | 'hi' | 'ta'

export interface Chapter {
  /** Start time in seconds. Leave out until the video exists: the chapter is then listed without a seek time. */
  t?: number
  label: string
}

/** The question an episode ends with, shown as a "Check yourself" card with a reveal button. */
export interface EpisodeCheck {
  question: string
  answer: string
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
  title: string
  /** The catalog's "Covers" line, shown in the curriculum and under the title. */
  summary: string
  /** The catalog's "Learner can" list, one short phrase per item. */
  outcomes: string[]
  /** The catalog's "Ends with" question and its answer. */
  check?: EpisodeCheck
  /** Catalog colour theme (accent bar); a neutral default is used when omitted. */
  theme?: EpisodeTheme
  /** Cover photo for cards and the lesson stage; a default is used when omitted. */
  cover?: CoverName
  /** AWS services the episode touches, shown as official icons with their names. */
  services?: AwsIconName[]
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
  /** Quiz id to offer after this episode (defaults to the quiz whose episodeId is this episode). */
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
  /** The Episode id this quiz checks, or 'final' for the final assessment (at most one). */
  episodeId: number | 'final'
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
  episodes: Episode[]
  labs: Lab[]
  quizzes: Quiz[]
}

/* ---- Home page sections (src/data/home.ts) ---- */

/**
 * A link in home data: a site path such as "/course" (in-app) or an absolute http(s):// URL (new tab).
 * Any other value is shown as plain text, not as a link.
 */
export interface HomeLink {
  label: string
  href: string
}

/** Site-wide bar above the header. Change `id` to show a new announcement to people who dismissed the last one. */
export interface Announcement {
  id: string
  text: string
  link?: HomeLink
}

/** The code or console panel shown in an episode's "Explore by episode" tab. */
export interface EpisodeSnippet {
  /** Must match an Episode id. */
  episodeId: number
  /** File name or caption above the code; also the copy button's accessible name. */
  label: string
  lang: CodeLang
  code: string
}

/** One step of the running story (the catalog's recurring character), tied to an episode. */
export interface JourneyStep {
  /** Must match an Episode id: sets the step's accent, "E0N" label and link. */
  episodeId: number
  text: string
}

/** Lucide icon used for an analogy row (see src/components/home/Analogy.tsx). */
export type AnalogyIcon = 'door' | 'menu' | 'chef' | 'dish' | 'manager' | 'kitchen'

/** One row of the course's running analogy. `meaning` is left out where the catalog gives none. */
export interface AnalogyItem {
  id: string
  icon: AnalogyIcon
  title: string
  meaning?: string
}

/** Simple Icons brand marks shipped in public/brand-marks/ (CC0 files, trademarks of their owners). */
export type ProviderMark = 'anthropic' | 'meta' | 'mistral' | 'deepseek'

/** A model provider chip; `models` lists the model names the catalog gives for it. */
export interface ModelProvider {
  name: string
  models?: string[]
  /** Monochrome brand mark next to the name; text only when omitted. */
  mark?: ProviderMark
  /** Official AWS service icon instead of a brand mark (Amazon models). */
  service?: AwsIconName
}

/** A "What's new" card in the learning hub. Without `href` the card is not a link. */
export interface HubPost {
  id: string
  /** Short label such as "Article" or "Video". */
  kind: string
  title: string
  text: string
  /** ISO date (YYYY-MM-DD); shown as "TBA" when missing. */
  date?: string
  href?: string
}

/** An event in the learning hub. */
export interface HubEvent {
  id: string
  title: string
  /** ISO date (YYYY-MM-DD); shown as "TBA" when missing. */
  date?: string
  location: string
  href?: string
}

export interface HomeSections {
  /** null hides the bar. */
  announcement: Announcement | null
  /** One-line descriptions under the header Learn menu links (routes are fixed in the header). */
  learnMenu: { labs: string; dashboard: string; certificate: string }
  explore: { lede: string; snippets: EpisodeSnippet[] }
  /** Provider chips in the model strip. */
  models: { lede: string; providers: ModelProvider[] }
  /** The running analogy section; `quote` is the catalog sentence, shown whole. */
  analogy: { title: string; quote: string; items: AnalogyItem[] }
  /** The recurring character's project, one step per episode. */
  journey: { title: string; lede: string; steps: JourneyStep[] }
  hub: { lede: string; cta: HomeLink; posts: HubPost[]; events: HubEvent[] }
  /** Copyable command in the closing call to action; null hides it. */
  closingCommand: { label: string; code: string } | null
}
