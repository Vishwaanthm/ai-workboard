import { describe, expect, it } from 'vitest'
import { courseCounts, courseData, placeholderFiles } from '@/data'
import { validateCourseData } from '@/data/validate'
import { cloneData } from './helpers'

const dataFiles = import.meta.glob('/src/data/{course,labs,quizzes,site,home}.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// File names under public/videos (the values are lazy loaders we never call; only the keys matter).
const publicFiles = Object.keys(import.meta.glob('/public/videos/**/*'))

describe('course data', () => {
  it('ships valid placeholder data', () => {
    expect(validateCourseData(courseData)).toEqual([])
  })

  it('points only at video, caption and poster files that exist in public/', () => {
    const paths = courseData.episodes.flatMap((e) => [
      ...Object.values(e.videos),
      ...Object.values(e.captions),
      ...(e.poster ? [e.poster] : []),
    ])
    expect(paths.length).toBeGreaterThan(0)
    for (const p of paths) {
      if (!p.startsWith('/')) continue // full https:// URLs live on another host
      expect(publicFiles, `missing public${p}`).toContain(`/public${p}`)
    }
  })

  it('marks every data file as placeholder content', () => {
    expect(Object.keys(dataFiles)).toHaveLength(5)
    for (const [path, raw] of Object.entries(dataFiles)) {
      const text = raw.replace(/\r\n/g, '\n')
      expect(text.trimStart().startsWith('/*\n * TODO(content)'), path).toBe(true)
      expect(text, path).toContain('export const IS_PLACEHOLDER = true')
    }
    expect(placeholderFiles).toHaveLength(5)
  })

  it('covers every state the pages need', () => {
    // The v2 catalog: 5 required episodes, each with its catalog theme, 4 chapters, outcomes and a check.
    expect(courseData.episodes.map((e) => e.title)).toEqual([
      'Welcome to Amazon Bedrock',
      'Talking to a model',
      'Pictures and video',
      'Guardrails',
      "From console to code, and what's next",
    ])
    expect(courseData.episodes.filter((e) => e.optional)).toHaveLength(0)
    expect(courseData.episodes.map((e) => e.theme)).toEqual(['glass', 'midnight', 'sunrise', 'slate', 'forest'])
    for (const e of courseData.episodes) {
      expect(e.chapters).toHaveLength(4)
      expect(e.outcomes.length).toBeGreaterThan(0)
      expect(e.check?.question).toMatch(/\?$/)
      expect(e.check?.answer).toBeTruthy()
      expect(e.services?.length).toBeGreaterThan(0)
    }
    // E01 is finished: real chapter names with start times from the video's timeline.
    const [e01, ...others] = courseData.episodes
    expect(e01!.chapters!.map((c) => c.label)).toEqual([
      'What Bedrock is',
      'Paying and getting in',
      'The console map',
      'The model menu',
    ])
    expect(e01!.chapters!.map((c) => c.t)).toEqual([0, 228, 452, 601])
    expect(e01!.videos).toEqual({ en: '/videos/e01/en.mp4' })
    expect(e01!.captions).toEqual({ en: '/videos/e01/en.vtt' })
    expect(e01!.poster).toBe('/videos/e01/poster.jpg')
    // The other episodes have no video and no chapter times yet.
    expect(others.every((e) => Object.keys(e.videos).length === 0)).toBe(true)
    expect(others.flatMap((e) => e.chapters ?? []).every((c) => c.t === undefined)).toBe(true)
    expect(courseData.episodes.filter((m) => m.labId)).toHaveLength(2)
    expect(courseData.labs.some((l) => l.untested && l.steps.some((s) => s.code))).toBe(true)
    expect(courseData.labs.some((l) => l.steps.every((s) => !s.code))).toBe(true)
    const kinds = new Set(courseData.episodes.flatMap((m) => (m.notes ?? []).map((n) => n.kind)))
    expect([...kinds].sort()).toEqual(['callout', 'code', 'list', 'p', 'steps', 'table'])
    for (const q of courseData.quizzes) expect(q.questions).toHaveLength(3)
    // One placeholder quiz per episode, plus the final.
    expect(courseData.quizzes.filter((q) => q.episodeId !== 'final').map((q) => q.episodeId)).toEqual([1, 2, 3, 4, 5])
    // Every episode has a length; only E01 has video files so far (the rest show "Video coming soon").
    for (const e of courseData.episodes) {
      expect(Object.keys(e.videos)).toHaveLength(e.id === 1 ? 1 : 0)
      expect(e.durationSec).toBeGreaterThan(0)
    }
    // E01 has its measured length (16:16); the rest show the catalog target as approximate.
    expect(courseData.episodes[0]!.durationSec).toBe(976)
    expect(courseData.episodes.map((e) => Boolean(e.durationApprox))).toEqual([false, true, true, true, true])
  })

  it('rejects a dangling lab reference', () => {
    const data = cloneData()
    data.episodes[0]!.labId = 'missing-lab'
    expect(validateCourseData(data).join('\n')).toMatch(/unknown lab "missing-lab"/)
  })

  it('rejects duplicate ids', () => {
    const data = cloneData()
    data.episodes[1]!.id = data.episodes[0]!.id
    expect(validateCourseData(data).join('\n')).toMatch(/Duplicate episode id/)
  })

  it('allows an episode without a quiz, but rejects two quizzes for one episode and a second final', () => {
    const data = cloneData()
    data.quizzes = data.quizzes.filter((q) => q.episodeId !== 1)
    expect(validateCourseData(data)).toEqual([])
    const twoForEpisode = cloneData()
    twoForEpisode.quizzes.push({ ...twoForEpisode.quizzes[0]!, id: 'episode-1b' })
    expect(validateCourseData(twoForEpisode).join('\n')).toMatch(/Episode 1 has 2 quizzes/)
    const unknown = cloneData()
    unknown.quizzes[0] = { ...unknown.quizzes[0]!, episodeId: 99 }
    expect(validateCourseData(unknown).join('\n')).toMatch(/unknown episode 99/)
    const twoFinals = cloneData()
    twoFinals.quizzes.push({ ...twoFinals.quizzes.at(-1)!, id: 'final-2' })
    expect(validateCourseData(twoFinals).join('\n')).toMatch(/at most one final quiz, found 2/)
  })

  it('accepts chapters without times, and checks times only when given', () => {
    const data = cloneData()
    const e = data.episodes[0]!
    // All untimed (shipped) is valid; all timed inside the episode is valid.
    expect(validateCourseData(data)).toEqual([])
    e.chapters = e.chapters!.map((c, i) => ({ ...c, t: i * 120 }))
    expect(validateCourseData(data)).toEqual([])
    // A time past the end, or times for only some chapters, are errors.
    e.chapters[3] = { ...e.chapters[3]!, t: e.durationSec + 1 }
    expect(validateCourseData(data).join('\n')).toMatch(/chapter "The model menu" is outside the episode/)
    e.chapters[3] = { label: 'The model menu' }
    expect(validateCourseData(data).join('\n')).toMatch(/start times for some chapters only/)
  })

  it('rejects an episode with no outcomes or a half-written check', () => {
    const data = cloneData()
    data.episodes[1]!.outcomes = []
    data.episodes[2]!.check = { question: 'A question?', answer: ' ' }
    const errors = validateCourseData(data).join('\n')
    expect(errors).toMatch(/Episode 2 needs at least one outcome/)
    expect(errors).toMatch(/Episode 3 check needs a question and an answer/)
  })

  it('rejects an out-of-range answerIndex and passMark', () => {
    const data = cloneData()
    data.quizzes[0]!.questions[0]!.answerIndex = 9
    data.quizzes[0]!.passMark = 1.5
    const errors = validateCourseData(data).join('\n')
    expect(errors).toMatch(/answerIndex is out of range/)
    expect(errors).toMatch(/passMark must be in/)
  })

  it('computes counts from the data', () => {
    const data = cloneData()
    expect(courseCounts(data)).toMatchObject({ episodes: 5, chapters: 20, labs: 2, episodeQuizzes: 5, hasFinal: true })
    data.labs.pop()
    data.episodes = data.episodes.map((m) => (m.labId === 'lab-2' ? { ...m, labId: undefined } : m))
    expect(courseCounts(data).labs).toBe(1)
  })
})
