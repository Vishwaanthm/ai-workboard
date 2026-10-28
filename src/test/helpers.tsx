import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppStateProvider } from '@/context/AppState'
import { courseData } from '@/data'
import type { CourseData } from '@/data/types'
import { certificateId } from '@/lib/hash'
import type { Account, Progress } from '@/lib/schema'
import { storageKeys } from '@/lib/storage'
import { buildRoutes } from '@/routes'

export const LEARNER = { name: 'Asha Raman', email: 'asha@example.com', password: 'correct-horse' }

export function cloneData(data: CourseData = courseData): CourseData {
  return structuredClone(data)
}

/** Writes a learner account + session straight into storage (the hash is never checked by these tests). */
export function seedLearner(progress?: Partial<Progress>, email = LEARNER.email, name = LEARNER.name): Account {
  const account: Account = {
    name,
    email,
    salt: 'a'.repeat(32),
    passwordHash: 'b'.repeat(64),
    createdAt: '2026-10-28T09:00:00.000Z',
  }
  window.localStorage.setItem(storageKeys.accounts, JSON.stringify({ [email]: account }))
  window.localStorage.setItem(storageKeys.session, JSON.stringify({ email }))
  if (progress) {
    window.localStorage.setItem(
      storageKeys.progress(email),
      JSON.stringify({ completedEpisodes: [], labSteps: {}, quizzes: {}, certificate: null, ...progress }),
    )
  }
  return account
}

/** Progress that meets every certificate requirement in `data`. */
export function completeProgress(data: CourseData = courseData): Progress {
  const quizzes: Progress['quizzes'] = {}
  for (const q of data.quizzes) {
    quizzes[q.id] = { best: q.questions.length, last: q.questions.length, attempts: 1, passed: true }
  }
  return {
    completedEpisodes: data.episodes.map((m) => m.id),
    labSteps: {},
    quizzes,
    certificate: null,
    watch: {},
  }
}

export function certificateFor(email = LEARNER.email, data: CourseData = courseData) {
  return {
    id: certificateId(email, data.course.title),
    issuedAt: '2026-10-28T10:00:00.000Z',
    name: LEARNER.name,
    email,
    course: data.course.title,
  }
}

export function renderApp(path: string, data: CourseData = courseData) {
  const router = createMemoryRouter(buildRoutes({ scrollRestoration: false }), { initialEntries: [path] })
  const utils = render(
    <AppStateProvider data={data}>
      <RouterProvider router={router} />
    </AppStateProvider>,
  )
  return { router, ...utils }
}

export function readProgress(email = LEARNER.email): Progress {
  return JSON.parse(window.localStorage.getItem(storageKeys.progress(email)) ?? 'null') as Progress
}
