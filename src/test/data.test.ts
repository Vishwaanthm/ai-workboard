import { describe, expect, it } from 'vitest'
import { courseCounts, courseData, placeholderFiles } from '@/data'
import { validateCourseData } from '@/data/validate'
import { cloneData } from './helpers'

const dataFiles = import.meta.glob('/src/data/{course,labs,quizzes,site}.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('course data', () => {
  it('ships valid placeholder data', () => {
    expect(validateCourseData(courseData)).toEqual([])
  })

  it('marks every data file as placeholder content', () => {
    expect(Object.keys(dataFiles)).toHaveLength(4)
    for (const [path, raw] of Object.entries(dataFiles)) {
      const text = raw.replace(/\r\n/g, '\n')
      expect(text.trimStart().startsWith('/*\n * TODO(content)'), path).toBe(true)
      expect(text, path).toContain('export const IS_PLACEHOLDER = true')
    }
    expect(placeholderFiles).toHaveLength(4)
  })

  it('covers every state the pages need', () => {
    // The catalog: 12 episodes in 5 named parts, every part required, each with a catalog colour theme.
    expect(courseData.parts.map((p) => p.title)).toEqual(['Foundations', 'Text models', 'Images and video', 'Safety', 'Building'])
    expect(courseData.parts.filter((p) => p.optional)).toHaveLength(0)
    expect(courseData.parts.map((p) => p.theme)).toEqual(['ocean', 'midnight', 'sunrise', 'slate', 'forest'])
    expect(courseData.episodes).toHaveLength(12)
    expect(courseData.episodes.map((e) => e.partId)).toEqual([1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5])
    expect(courseData.episodes.filter((m) => m.labId)).toHaveLength(2)
    expect(courseData.labs.some((l) => l.untested && l.steps.some((s) => s.code))).toBe(true)
    expect(courseData.labs.some((l) => l.steps.every((s) => !s.code))).toBe(true)
    const kinds = new Set(courseData.episodes.flatMap((m) => (m.notes ?? []).map((n) => n.kind)))
    expect([...kinds].sort()).toEqual(['callout', 'code', 'list', 'p', 'steps', 'table'])
    for (const q of courseData.quizzes) expect(q.questions).toHaveLength(3)
    // Quizzes are optional per part: some parts have one, the rest have none.
    expect(courseData.quizzes.filter((q) => q.partId !== 'final')).toHaveLength(2)
    // Episodes carry the video fields; no files yet ("Video coming soon").
    for (const e of courseData.episodes) {
      expect(Object.keys(e.videos)).toHaveLength(0)
      expect(e.durationSec).toBeGreaterThan(0)
    }
    // E01 and E02 have measured lengths; the rest show the catalog target as approximate.
    expect(courseData.episodes.map((e) => Boolean(e.durationApprox))).toEqual([false, false, ...Array(10).fill(true)])
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

  it('allows a part without a quiz, but rejects two quizzes in one part and a second final', () => {
    const data = cloneData()
    data.quizzes = data.quizzes.filter((q) => q.partId !== 1)
    expect(validateCourseData(data)).toEqual([])
    const twoInPart = cloneData()
    twoInPart.quizzes.push({ ...twoInPart.quizzes[0]!, id: 'part-1b' })
    expect(validateCourseData(twoInPart).join('\n')).toMatch(/Part 1 has 2 quizzes/)
    const twoFinals = cloneData()
    twoFinals.quizzes.push({ ...twoFinals.quizzes.at(-1)!, id: 'final-2' })
    expect(validateCourseData(twoFinals).join('\n')).toMatch(/at most one final quiz, found 2/)
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
    expect(courseCounts(data)).toMatchObject({ parts: 5, episodes: 12, labs: 2, partQuizzes: 2, hasFinal: true })
    data.labs.pop()
    data.episodes = data.episodes.map((m) => (m.labId === 'lab-2' ? { ...m, labId: undefined } : m))
    expect(courseCounts(data).labs).toBe(1)
  })
})
