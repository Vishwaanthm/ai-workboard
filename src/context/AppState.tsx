import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { courseData } from '@/data'
import type { CourseData, Quiz } from '@/data/types'
import * as auth from '@/lib/auth'
import { certificateId } from '@/lib/hash'
import * as rules from '@/lib/progress'
import * as watchRules from '@/lib/watch'
import {
  emptyProgress,
  validateProgress,
  type Account,
  type CertificateRecord,
  type Progress,
} from '@/lib/schema'
import {
  STORAGE_PREFIX,
  isStorageAvailable,
  readJSON,
  removeKey,
  storageKeys,
  writeJSON,
} from '@/lib/storage'

export interface AppStateValue {
  data: CourseData
  user: Account | null
  progress: Progress
  storageAvailable: boolean
  /** True from a successful login/register submit until that page has navigated. */
  authInProgress: boolean
  register: (input: auth.RegisterInput) => Promise<auth.AuthResult>
  login: (email: string, password: string) => Promise<auth.AuthResult>
  logout: () => void
  /** Called when the login/register page unmounts; re-enables the guest-only redirect. */
  finishAuth: () => void
  setEpisodeComplete: (episodeId: number, done: boolean) => void
  setStepDone: (labId: string, stepId: string, done: boolean) => void
  resetLab: (labId: string) => void
  recordQuiz: (quiz: Quiz, correct: number) => void
  /** Saves a playback sample (throttled by the player). */
  recordWatch: (episodeId: number, positionSec: number, durationSec: number) => void
  issueCertificate: () => CertificateRecord | null
  resetProgress: () => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)

export function loadProgress(email: string, data: CourseData): Progress {
  return readJSON(storageKeys.progress(email), emptyProgress(), (v) => validateProgress(v, { email, data }))
}

const SAVE_FAILED = 'Progress could not be saved in this browser. It will be lost when you close the tab.'

export function AppStateProvider({ children, data = courseData }: { children: ReactNode; data?: CourseData }) {
  const [storageAvailable] = useState(isStorageAvailable)
  const [authInProgress, setAuthInProgress] = useState(false)
  const [user, setUser] = useState<Account | null>(() => auth.readSessionAccount())
  const [progress, setProgress] = useState<Progress>(() => {
    const account = auth.readSessionAccount()
    return account ? loadProgress(account.email, data) : emptyProgress()
  })

  // Latest progress for callbacks, so actions keep a stable identity across progress updates.
  const progressRef = useRef(progress)
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const reload = useCallback(() => {
    const account = auth.readSessionAccount()
    setUser(account)
    setProgress(account ? loadProgress(account.email, data) : emptyProgress())
  }, [data])

  // Keep tabs in sync: another tab may log in, log out or change progress.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(STORAGE_PREFIX)) reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [reload])

  /**
   * Applies a rule to the latest stored progress, so changes another tab saved earlier are kept. The
   * read-apply-write runs synchronously in one task; two tabs writing in the same instant can still race
   * (last write wins). Accepted for a client-only demo without Web Locks.
   */
  const update = useCallback(
    (change: (p: Progress) => Progress) => {
      if (!user) return
      const base = storageAvailable ? loadProgress(user.email, data) : progressRef.current
      const next = change(base)
      if (!writeJSON(storageKeys.progress(user.email), next)) toast.error(SAVE_FAILED)
      progressRef.current = next
      setProgress(next)
    },
    [user, data, storageAvailable],
  )

  /** Like update, but without a toast: playback samples are saved every few seconds. */
  const updateQuietly = useCallback(
    (change: (p: Progress) => Progress) => {
      if (!user) return
      const base = storageAvailable ? loadProgress(user.email, data) : progressRef.current
      const next = change(base)
      writeJSON(storageKeys.progress(user.email), next)
      progressRef.current = next
      setProgress(next)
    },
    [user, data, storageAvailable],
  )

  const setEpisodeComplete = useCallback(
    (episodeId: number, done: boolean) => update((p) => rules.setEpisodeComplete(p, episodeId, done)),
    [update],
  )
  const setStepDone = useCallback(
    (labId: string, stepId: string, done: boolean) => update((p) => rules.setStepDone(p, labId, stepId, done)),
    [update],
  )
  const resetLab = useCallback((labId: string) => update((p) => rules.resetLab(p, labId)), [update])
  const recordQuiz = useCallback(
    (quiz: Quiz, correct: number) => update((p) => rules.recordQuiz(p, quiz, correct)),
    [update],
  )
  const recordWatch = useCallback(
    (episodeId: number, positionSec: number, durationSec: number) =>
      updateQuietly((p) =>
        watchRules.recordWatch(p, episodeId, { positionSec, durationSec, at: new Date().toISOString() }),
      ),
    [updateQuietly],
  )

  const register = useCallback(
    async (input: auth.RegisterInput) => {
      const result = await auth.register(input)
      if (result.ok) {
        setAuthInProgress(true)
        reload()
      }
      return result
    },
    [reload],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await auth.login(email, password)
      if (result.ok) {
        setAuthInProgress(true)
        reload()
      }
      return result
    },
    [reload],
  )

  const finishAuth = useCallback(() => setAuthInProgress(false), [])

  const logout = useCallback(() => {
    auth.logout()
    setUser(null)
    setProgress(emptyProgress())
  }, [])

  const issueCertificate = useCallback((): CertificateRecord | null => {
    if (!user) return null
    const latest = storageAvailable ? loadProgress(user.email, data) : progressRef.current
    if (latest.certificate) {
      setProgress(latest)
      return latest.certificate
    }
    if (!rules.isEligible(latest, data)) return null
    const record: CertificateRecord = {
      id: certificateId(user.email, data.course.title),
      issuedAt: new Date().toISOString(),
      name: user.name,
      email: user.email,
      course: data.course.title,
    }
    // Shown as issued only once it is saved and reads back valid; otherwise the caller reports the failure.
    if (!storageAvailable || !writeJSON(storageKeys.progress(user.email), { ...latest, certificate: record })) {
      return null
    }
    const confirmed = loadProgress(user.email, data)
    setProgress(confirmed)
    return confirmed.certificate
  }, [user, data, storageAvailable])

  const resetProgress = useCallback(() => {
    if (!user) return
    if (!removeKey(storageKeys.progress(user.email)) && storageAvailable) toast.error(SAVE_FAILED)
    setProgress(emptyProgress())
  }, [user, storageAvailable])

  const value = useMemo<AppStateValue>(
    () => ({
      data,
      user,
      progress,
      storageAvailable,
      authInProgress,
      finishAuth,
      register,
      login,
      logout,
      setEpisodeComplete,
      setStepDone,
      resetLab,
      recordQuiz,
      recordWatch,
      issueCertificate,
      resetProgress,
    }),
    [
      data,
      user,
      progress,
      storageAvailable,
      authInProgress,
      finishAuth,
      register,
      login,
      logout,
      setEpisodeComplete,
      setStepDone,
      resetLab,
      recordQuiz,
      recordWatch,
      issueCertificate,
      resetProgress,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
