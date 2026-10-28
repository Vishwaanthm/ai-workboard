/**
 * Validators for everything persisted in localStorage. Stored data is never trusted: unknown ids are
 * dropped, scores are bounded, quiz pass state is recomputed, and a certificate record is kept only when
 * it is bound to the signed-in account and this course. This guards against corrupt or stale data in a
 * client-only demo; it is not a security boundary.
 */
import type { CourseData } from '@/data/types'
import { certificateId } from './hash'

export interface Account {
  name: string
  email: string
  salt: string
  passwordHash: string
  createdAt: string
}

export type Accounts = Record<string, Account>

export interface Session {
  email: string
}

export interface QuizRecord {
  best: number
  last: number
  attempts: number
  passed: boolean
}

export interface CertificateRecord {
  id: string
  issuedAt: string
  name: string
  email: string
  course: string
}

/** Saved playback for one episode (seconds). */
export interface WatchRecord {
  positionSec: number
  maxSec: number
  durationSec: number
  updatedAt: string
}

export interface Progress {
  completedEpisodes: number[]
  labSteps: Record<string, string[]>
  quizzes: Record<string, QuizRecord>
  certificate: CertificateRecord | null
  /** Keyed by episode id. */
  watch: Record<string, WatchRecord>
}

export const NAME_MAX = 60

export function emptyProgress(): Progress {
  return { completedEpisodes: [], labSteps: {}, quizzes: {}, certificate: null, watch: {} }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isHex = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{16,128}$/.test(v)
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/
const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && ISO_8601.test(v) && !Number.isNaN(Date.parse(v))

export function validName(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.trim().length <= NAME_MAX
}

export function validateAccount(v: unknown): Account | null {
  if (!isObject(v)) return null
  const { name, email, salt, passwordHash, createdAt } = v
  if (!validName(name)) return null
  if (typeof email !== 'string' || email !== email.trim().toLowerCase() || !email.includes('@')) return null
  if (!isHex(salt) || !isHex(passwordHash) || !isIsoDate(createdAt)) return null
  return { name: name.trim(), email, salt, passwordHash, createdAt }
}

export function validateAccounts(v: unknown): Accounts | null {
  if (!isObject(v)) return null
  const out: Accounts = {}
  for (const [key, value] of Object.entries(v)) {
    const account = validateAccount(value)
    if (account && account.email === key) out[key] = account
  }
  return out
}

export function validateSession(v: unknown, accounts: Accounts): Session | null {
  if (!isObject(v) || typeof v.email !== 'string') return null
  return Object.hasOwn(accounts, v.email) ? { email: v.email } : null
}

export function passMarkOf(passMark: number | undefined): number {
  return passMark !== undefined && passMark > 0 && passMark <= 1 ? passMark : 0.8
}

export function isPassingScore(correct: number, total: number, passMark: number | undefined): boolean {
  if (total <= 0) return false
  return correct / total >= passMarkOf(passMark) - 1e-9
}

export interface ProgressContext {
  email: string
  data: CourseData
}

export function validateCertificate(v: unknown, ctx: ProgressContext): CertificateRecord | null {
  if (!isObject(v)) return null
  const { id, issuedAt, name, email, course } = v
  if (typeof id !== 'string' || !isIsoDate(issuedAt) || !validName(name)) return null
  if (email !== ctx.email || course !== ctx.data.course.title) return null
  if (id !== certificateId(ctx.email, ctx.data.course.title)) return null
  return { id, issuedAt, name: name.trim(), email, course }
}

export function validateProgress(v: unknown, ctx: ProgressContext): Progress | null {
  if (!isObject(v)) return null
  const { data } = ctx
  const out = emptyProgress()

  // Records saved before the episode model used `completedModules`; ids carry over unchanged.
  const completed = Array.isArray(v.completedEpisodes) ? v.completedEpisodes : v.completedModules
  if (Array.isArray(completed)) {
    const known = new Set(data.episodes.map((m) => m.id))
    out.completedEpisodes = [...new Set(completed.filter((id): id is number => isInt(id) && known.has(id)))]
  }

  if (isObject(v.labSteps)) {
    for (const lab of data.labs) {
      const steps = v.labSteps[lab.id]
      if (!Array.isArray(steps)) continue
      const known = new Set(lab.steps.map((s) => s.id))
      const kept = [...new Set(steps.filter((s): s is string => typeof s === 'string' && known.has(s)))]
      if (kept.length > 0) out.labSteps[lab.id] = kept
    }
  }

  if (isObject(v.quizzes)) {
    for (const quiz of data.quizzes) {
      const record = v.quizzes[quiz.id]
      if (!isObject(record)) continue
      const total = quiz.questions.length
      const { best, last, attempts } = record
      if (!isInt(best) || !isInt(last) || best < 0 || last < 0 || best > total || last > total || last > best) continue
      out.quizzes[quiz.id] = {
        best,
        last,
        attempts: isInt(attempts) && attempts >= 1 ? attempts : 1,
        passed: isPassingScore(best, total, quiz.passMark),
      }
    }
  }

  out.certificate = validateCertificate(v.certificate, ctx)

  if (isObject(v.watch)) {
    const MAX_SEC = 24 * 3600
    const okSec = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_SEC
    for (const episode of data.episodes) {
      const record = v.watch[String(episode.id)]
      if (!isObject(record)) continue
      const { positionSec, maxSec, durationSec, updatedAt } = record
      if (!okSec(positionSec) || !okSec(maxSec) || !okSec(durationSec) || !isIsoDate(updatedAt)) continue
      if (durationSec > 0 && (positionSec > durationSec + 1 || maxSec > durationSec + 1)) continue
      out.watch[String(episode.id)] = { positionSec, maxSec: Math.max(maxSec, positionSec), durationSec, updatedAt }
    }
  }
  return out
}
