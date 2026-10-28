import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { courseData, firstLesson } from '@/data'
import * as auth from '@/lib/auth'
import { validateProgress } from '@/lib/schema'
import { certificateFor, cloneData, completeProgress, LEARNER, readProgress, renderApp, seedLearner } from './helpers'

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name })

describe('regressions from code inspection 2', () => {
  it('REV-009: a failed session write rolls the new account back', async () => {
    const realSetItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'awb:v1:session') throw new DOMException('full', 'QuotaExceededError')
      return realSetItem.call(this, key, value)
    })
    expect(await auth.register(LEARNER)).toEqual({ ok: false, reason: 'storage' })
    expect(auth.readAccounts()).toEqual({})
    spy.mockRestore()
    const retry = await auth.register(LEARNER)
    expect(retry.ok).toBe(true)
  })

  it('REV-010: certificate issuedAt must be strict ISO-8601', () => {
    const ctx = { email: LEARNER.email, data: courseData }
    const progress = completeProgress()
    const good = { ...certificateFor(), issuedAt: '2026-10-28T10:00:00.000Z' }
    expect(validateProgress({ ...progress, certificate: good }, ctx)?.certificate).toEqual(good)
    for (const issuedAt of ['March 1, 2020', '2026-10-28', '2026-13-45T99:99:99Z']) {
      expect(validateProgress({ ...progress, certificate: { ...good, issuedAt } }, ctx)?.certificate).toBeNull()
    }
  })
})

describe('regressions from code inspection 1', () => {
  it('REV-004: a signed-in learner on /login always goes to the dashboard, even with next', async () => {
    seedLearner()
    const { router } = renderApp(`/login?next=${encodeURIComponent('/certificate')}`)
    await heading(`Welcome back, ${LEARNER.name}`)
    expect(router.state.location.pathname).toBe('/dashboard')
  })

  it('REV-004: a successful login still honours a safe next', async () => {
    const user = userEvent.setup()
    // Create the account, then log out so the login form is shown.
    const { router, unmount } = renderApp('/register')
    await heading('Create your account')
    await user.type(screen.getByLabelText('Full name'), LEARNER.name)
    await user.type(screen.getByLabelText('Email'), LEARNER.email)
    await user.type(screen.getByLabelText('Password'), LEARNER.password)
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await heading(`Welcome back, ${LEARNER.name}`)
    expect(router.state.location.pathname).toBe('/dashboard')
    unmount()
    window.localStorage.removeItem('awb:v1:session')

    const second = renderApp(`/login?next=${encodeURIComponent('/learn/3')}`)
    await heading('Log in')
    await user.type(screen.getByLabelText('Email'), LEARNER.email)
    await user.type(screen.getByLabelText('Password'), LEARNER.password)
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await heading('Episode 3 title')
    expect(second.router.state.location.pathname).toBe('/learn/3')
  })

  it('REV-002: a certificate that cannot be saved is not shown as issued', async () => {
    seedLearner(completeProgress())
    const realSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key.startsWith('awb:v1:progress:')) throw new DOMException('full', 'QuotaExceededError')
      return realSetItem.call(this, key, value)
    })
    renderApp('/certificate')
    await heading('Certificate')
    expect(await screen.findByText('Your certificate could not be saved')).toBeInTheDocument()
    expect(screen.queryByTestId('certificate')).not.toBeInTheDocument()
    expect(readProgress().certificate).toBeNull()
  })

  it('REV-005: the new page heading takes focus after in-app navigation, including lesson to lesson', async () => {
    const user = userEvent.setup()
    seedLearner()
    renderApp('/learn/1')
    await heading('Episode 1 title')
    const lessonNav = screen.getByRole('navigation', { name: 'Episodes' })
    await user.click(within(lessonNav).getByRole('link', { name: /Episode 2 title/ }))
    expect(await heading('Episode 2 title')).toHaveFocus()
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    await user.click(within(crumbs).getByRole('link', { name: 'Course' }))
    expect(await heading('Amazon Bedrock for Beginners')).toHaveFocus()
  })

  it('REV-006: a new learner starts at the first required episode, not an optional first episode', () => {
    const data = cloneData()
    data.episodes[0] = { ...data.episodes[0]!, optional: true, labId: undefined }
    data.labs = data.labs.filter((l) => l.episodeId !== 1)
    expect(firstLesson(data)?.id).toBe(2)
  })
})
