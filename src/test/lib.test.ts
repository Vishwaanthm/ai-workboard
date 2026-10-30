import { afterEach, describe, expect, it, vi } from 'vitest'
import { courseData, episodeQuizzes, finalQuiz } from '@/data'
import * as auth from '@/lib/auth'
import { base32Of40Bits, CERTIFICATE_ID_PATTERN, certificateId } from '@/lib/hash'
import {
  certificateEligibility,
  isEligible,
  nextStep,
  recordQuiz,
  resetLab,
  setEpisodeComplete,
  setStepDone,
  visibleCertificate,
} from '@/lib/progress'
import { safeNext } from '@/lib/redirect'
import { emptyProgress, validateProgress } from '@/lib/schema'
import { readJSON, storageKeys, writeJSON } from '@/lib/storage'
import { partSpans } from '@/lib/utils'
import { parseTimestamp, parseVtt } from '@/lib/vtt'
import {
  continueWatching,
  courseDuration,
  durationLabel,
  formatDuration,
  recordWatch,
  resumePosition,
  spokenDuration,
  spokenDurationLabel,
  totalDurationLabel,
  watchState,
} from '@/lib/watch'
import { certificateFor, cloneData, completeProgress, LEARNER } from './helpers'

const ctx = { email: LEARNER.email, data: courseData }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('storage', () => {
  it('falls back on malformed JSON', () => {
    window.localStorage.setItem('awb:v1:test', '{not json')
    expect(readJSON('awb:v1:test', 'fallback', (v) => (typeof v === 'string' ? v : null))).toBe('fallback')
  })

  it('falls back when the validator rejects the value', () => {
    window.localStorage.setItem('awb:v1:test', '42')
    expect(readJSON('awb:v1:test', 'fallback', (v) => (typeof v === 'string' ? v : null))).toBe('fallback')
  })

  it('falls back when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(readJSON('awb:v1:test', 'fallback', () => 'never')).toBe('fallback')
  })

  it('reports a failed write (quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(writeJSON('awb:v1:test', { a: 1 })).toBe(false)
  })
})

describe('schema', () => {
  it('drops unknown ids and out-of-range scores, and recomputes passed', () => {
    const cleaned = validateProgress(
      {
        completedEpisodes: [1, 1, 999, 'x'],
        labSteps: { 'lab-1': ['step-1', 'nope'], 'ghost-lab': ['step-1'] },
        quizzes: {
          'episode-1': { best: 3, last: 3, attempts: 2, passed: false },
          'episode-2': { best: 99, last: 1, attempts: 1, passed: true },
          'ghost-quiz': { best: 1, last: 1, attempts: 1, passed: true },
          final: { best: 1, last: 1, attempts: 1, passed: true },
        },
        certificate: null,
      },
      ctx,
    )
    expect(cleaned).toEqual({
      completedEpisodes: [1],
      labSteps: { 'lab-1': ['step-1'] },
      quizzes: {
        'episode-1': { best: 3, last: 3, attempts: 2, passed: true },
        final: { best: 1, last: 1, attempts: 1, passed: false },
      },
      certificate: null,
      watch: {},
    })
  })

  it('keeps a certificate bound to this learner and course', () => {
    const cert = certificateFor()
    expect(validateProgress({ ...completeProgress(), certificate: cert }, ctx)?.certificate).toEqual(cert)
  })

  it('discards forged certificates: wrong id, other learner, other course', () => {
    const cert = certificateFor()
    const variants = [
      { ...cert, id: 'AWB-AAAA-BBBB' },
      { ...cert, email: 'someone@example.com' },
      { ...cert, course: 'Another course' },
      { ...cert, issuedAt: 'not a date' },
    ]
    for (const certificate of variants) {
      expect(validateProgress({ ...completeProgress(), certificate }, ctx)?.certificate).toBeNull()
    }
  })

  it('hides a stored certificate while requirements are unmet', () => {
    const progress = { ...emptyProgress(), certificate: certificateFor() }
    expect(visibleCertificate(progress, courseData)).toBeNull()
  })
})

describe('certificate id', () => {
  it('has the fixed format and alphabet', () => {
    const id = certificateId(LEARNER.email, courseData.course.title)
    expect(id).toMatch(CERTIFICATE_ID_PATTERN)
    expect(id).toHaveLength(13)
  })

  it('is deterministic and normalises the email', () => {
    expect(certificateId(' ASHA@example.com ', 'T')).toBe(certificateId('asha@example.com', 'T'))
  })

  it('differs between learners and courses', () => {
    const ids = new Set([
      certificateId('a@example.com', 'T'),
      certificateId('b@example.com', 'T'),
      certificateId('a@example.com', 'U'),
    ])
    expect(ids.size).toBe(3)
  })

  it('encodes the 40-bit boundaries', () => {
    expect(base32Of40Bits(0)).toBe('AAAAAAAA')
    expect(base32Of40Bits(2 ** 40 - 1)).toBe('77777777')
  })
})

describe('auth', () => {
  it('registers, rejects duplicates, logs in and out', async () => {
    const created = await auth.register({ ...LEARNER, email: ' Asha@Example.com ' })
    expect(created.ok).toBe(true)
    expect(auth.readSessionAccount()?.email).toBe('asha@example.com')

    const dup = await auth.register(LEARNER)
    expect(dup).toEqual({ ok: false, reason: 'exists' })

    auth.logout()
    expect(auth.readSessionAccount()).toBeNull()

    expect(await auth.login('asha@example.com', 'wrong-password')).toEqual({ ok: false, reason: 'credentials' })
    expect(await auth.login('nobody@example.com', LEARNER.password)).toEqual({ ok: false, reason: 'credentials' })
    const ok = await auth.login('ASHA@example.com', LEARNER.password)
    expect(ok.ok).toBe(true)
    expect(auth.readSessionAccount()?.name).toBe(LEARNER.name)
  })

  it('validates registration fields', async () => {
    const result = await auth.register({ name: ' ', email: 'not-an-email', password: 'short' })
    expect(result.ok).toBe(false)
    if (!result.ok && result.reason === 'invalid') {
      expect(Object.keys(result.errors).sort()).toEqual(['email', 'name', 'password'])
    }
    expect(window.localStorage.getItem(storageKeys.accounts)).toBeNull()
  })
})

describe('progress rules', () => {
  it('toggles episodes and lab steps, and resets a lab', () => {
    let p = setEpisodeComplete(emptyProgress(), 1, true)
    expect(p.completedEpisodes).toEqual([1])
    p = setEpisodeComplete(p, 1, false)
    expect(p.completedEpisodes).toEqual([])
    p = setStepDone(p, 'lab-1', 'step-1', true)
    p = setStepDone(p, 'lab-1', 'step-2', true)
    expect(p.labSteps['lab-1']).toEqual(['step-1', 'step-2'])
    p = resetLab(p, 'lab-1')
    expect(p.labSteps).toEqual({})
  })

  it('uses the default pass mark of 0.8 and honours an override', () => {
    const quiz = courseData.quizzes[0]!
    expect(recordQuiz(emptyProgress(), quiz, 2).quizzes[quiz.id]?.passed).toBe(false)
    expect(recordQuiz(emptyProgress(), quiz, 3).quizzes[quiz.id]?.passed).toBe(true)
    const lenient = { ...quiz, passMark: 0.6 }
    expect(recordQuiz(emptyProgress(), lenient, 2).quizzes[quiz.id]?.passed).toBe(true)
  })

  it('keeps the best score across attempts', () => {
    const quiz = courseData.quizzes[0]!
    const p = recordQuiz(recordQuiz(emptyProgress(), quiz, 3), quiz, 1)
    expect(p.quizzes[quiz.id]).toEqual({ best: 3, last: 1, attempts: 2, passed: true })
  })

  it('orders next steps: each episode, then its quiz, then the final and the certificate', () => {
    let p = emptyProgress()
    expect(nextStep(p, courseData)).toMatchObject({ kind: 'episode', episode: { id: 1 } })
    p = setEpisodeComplete(p, 1, true)
    expect(nextStep(p, courseData)).toMatchObject({ kind: 'quiz', quiz: { id: 'episode-1' } })
    p = recordQuiz(p, courseData.quizzes[0]!, 3)
    expect(nextStep(p, courseData)).toMatchObject({ kind: 'episode', episode: { id: 2 } })
    for (const id of [2, 3, 4, 5]) p = setEpisodeComplete(p, id, true)
    // Watching ahead does not skip a quiz: the earliest unpassed episode quiz comes first.
    expect(nextStep(p, courseData)).toMatchObject({ kind: 'quiz', quiz: { id: 'episode-2' } })
    for (const quiz of episodeQuizzes(courseData)) p = recordQuiz(p, quiz, 3)
    expect(nextStep(p, courseData)).toMatchObject({ kind: 'final' })
    p = recordQuiz(p, finalQuiz(courseData)!, 3)
    expect(nextStep(p, courseData)).toEqual({ kind: 'certificate' })
  })

  it('offers a quiz on an optional episode before the final, since it still unlocks the final', () => {
    const data = cloneData()
    data.episodes[4] = { ...data.episodes[4]!, optional: true }
    let p = emptyProgress()
    for (const id of [1, 2, 3, 4]) p = setEpisodeComplete(p, id, true)
    for (const quiz of episodeQuizzes(data).filter((q) => q.episodeId !== 5)) p = recordQuiz(p, quiz, 3)
    expect(nextStep(p, data)).toMatchObject({ kind: 'quiz', quiz: { id: 'episode-5' } })
  })

  it('lists unmet certificate requirements; optional episodes are not required', () => {
    expect(certificateEligibility(emptyProgress(), courseData)).toHaveLength(5 + episodeQuizzes(courseData).length + 1)
    const p = completeProgress()
    p.completedEpisodes = p.completedEpisodes.filter((id) => id !== 5)
    expect(isEligible(p, courseData)).toBe(false)
    // Mark episode 5 optional: then watching it is no longer needed.
    const data = cloneData()
    data.episodes[4] = { ...data.episodes[4]!, optional: true }
    expect(certificateEligibility(emptyProgress(), data)).toHaveLength(4 + episodeQuizzes(data).length + 1)
    expect(isEligible(p, data)).toBe(true)
  })
})

describe('safeNext', () => {
  it('rejects anything but a same-origin path', () => {
    for (const bad of ['//evil.example', '/\\evil.example', 'https://x.example', '', null, undefined, 'learn/1']) {
      expect(safeNext(bad)).toBe('/dashboard')
    }
    expect(safeNext('/learn/1')).toBe('/learn/1')
    expect(safeNext('/labs/lab-1?x=1')).toBe('/labs/lab-1?x=1')
  })
})

describe('partSpans', () => {
  it('never leaves an empty cell in a 3-column grid', () => {
    for (let n = 1; n <= 8; n++) {
      const spans = partSpans(n)
      expect(spans).toHaveLength(n)
      expect(spans.reduce((a, b) => a + b, 0) % 3).toBe(0)
    }
  })
})

describe('vtt parser', () => {
  it('reads cues, skips headers, ids and notes, and strips tags', () => {
    const vtt = [
      'WEBVTT',
      '',
      'NOTE produced by the pipeline',
      '',
      '1',
      '00:00:01.000 --> 00:00:03.500 align:start',
      '<v Narrator>Hello &amp; welcome</v>',
      '',
      '00:01:02.250 --> 00:01:04.000',
      'Second line',
      'continues here',
      '',
    ].join('\r\n')
    expect(parseVtt(vtt)).toEqual([
      { start: 1, end: 3.5, text: 'Hello & welcome' },
      { start: 62.25, end: 64, text: 'Second line continues here' },
    ])
    expect(parseTimestamp('01:02.5')).toBeCloseTo(62.5)
    expect(parseTimestamp('bad')).toBeNull()
  })
})

describe('watch progress', () => {
  const episode = courseData.episodes[0]!

  it('formats durations and course totals', () => {
    expect(formatDuration(420)).toBe('7:00')
    expect(formatDuration(6016)).toBe('100:16')
    expect(courseDuration(courseData)).toBe(6016)
    expect(spokenDuration(450)).toBe('7 minutes 30 seconds')
    // Approximate (catalog target) lengths round to whole minutes with a "≈" mark.
    expect(durationLabel(441)).toBe('7:21')
    expect(durationLabel(480, true)).toBe('≈ 8 min')
    expect(spokenDurationLabel(480, true)).toBe('about 8 minutes')
    expect(totalDurationLabel(courseData.episodes)).toBe('≈ 100 min')
    expect(totalDurationLabel(courseData.episodes.slice(0, 1))).toBe('16:16')
  })

  it('keeps the furthest point, resumes mid-episode, and counts 90% as watched', () => {
    let p = emptyProgress()
    p = recordWatch(p, episode.id, { positionSec: 200, durationSec: 420, at: '2026-10-28T10:00:00.000Z' })
    p = recordWatch(p, episode.id, { positionSec: 50, durationSec: 420, at: '2026-10-28T10:01:00.000Z' })
    expect(p.watch['1']).toMatchObject({ positionSec: 50, maxSec: 200 })
    expect(watchState(p, episode)).toBe('partly')
    expect(resumePosition(p, episode)).toBe(50)
    expect(continueWatching(p, courseData)?.episode.id).toBe(1)
    p = recordWatch(p, episode.id, { positionSec: 380, durationSec: 420, at: '2026-10-28T10:02:00.000Z' })
    expect(watchState(p, episode)).toBe('watched')
    expect(continueWatching(p, courseData)).toBeNull()
  })

  it('drops invalid watch records from storage', () => {
    const cleaned = validateProgress(
      {
        completedEpisodes: [],
        watch: {
          '1': { positionSec: 10, maxSec: 20, durationSec: 420, updatedAt: '2026-10-28T10:00:00.000Z' },
          '2': { positionSec: -1, maxSec: 20, durationSec: 420, updatedAt: '2026-10-28T10:00:00.000Z' },
          '3': { positionSec: 999, maxSec: 999, durationSec: 420, updatedAt: '2026-10-28T10:00:00.000Z' },
          '99': { positionSec: 1, maxSec: 1, durationSec: 1, updatedAt: '2026-10-28T10:00:00.000Z' },
        },
      },
      ctx,
    )
    expect(Object.keys(cleaned?.watch ?? {})).toEqual(['1'])
  })
})

describe('progress migration', () => {
  it('keeps completions saved under the pre-episode field name', () => {
    const cleaned = validateProgress({ completedModules: [1, 2, 999], labSteps: {}, quizzes: {} }, ctx)
    expect(cleaned?.completedEpisodes).toEqual([1, 2])
    expect(cleaned?.watch).toEqual({})
  })
})
