import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { courseData } from '@/data'
import type { Episode } from '@/data/types'
import {
  certificateFor,
  cloneData,
  completeProgress,
  LEARNER,
  readProgress,
  renderApp,
  seedLearner,
} from './helpers'

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name })
const title = (id: number) => courseData.episodes.find((e) => e.id === id)!.title
/** A minimal valid episode for tests that grow the course. */
const extraEpisode = (id: number): Episode => ({
  id,
  number: id,
  title: `Extra episode ${id}`,
  summary: 'Extra.',
  outcomes: ['Extra outcome'],
  durationSec: 300,
  videos: {},
  captions: {},
})

describe('routing', () => {
  it('renders every public route', async () => {
    renderApp('/')
    expect(await heading(courseData.course.title)).toBeInTheDocument()
  })

  it.each([
    ['/course', courseData.course.title],
    ['/labs', 'Labs'],
    ['/login', 'Log in'],
    ['/register', 'Create your account'],
    ['/does-not-exist', 'Page not found'],
  ])('renders %s', async (path, title) => {
    renderApp(path)
    expect(await heading(title)).toBeInTheDocument()
  })

  it.each(courseData.episodes.map((m) => [m.id, m.title] as const))('renders lesson %s', async (id, title) => {
    seedLearner()
    renderApp(`/learn/${id}`)
    expect(await heading(title)).toBeInTheDocument()
    const episode = courseData.episodes.find((e) => e.id === id)!
    if (Object.keys(episode.videos).length > 0) {
      // A finished episode shows the player, not the placeholder.
      expect(screen.getByLabelText(`Episode ${episode.number}: ${episode.title}`)).toBeInTheDocument()
      expect(screen.queryByText('Video coming soon')).not.toBeInTheDocument()
    } else {
      expect(screen.getByText('Video coming soon')).toBeInTheDocument()
    }
  })

  it.each(courseData.labs.map((l) => [l.id, l.title] as const))('renders lab %s', async (id, title) => {
    seedLearner()
    renderApp(`/labs/${id}`)
    expect(await heading(title)).toBeInTheDocument()
  })

  it.each(courseData.quizzes.map((q) => [q.id, q.title] as const))('renders quiz %s', async (id, title) => {
    seedLearner()
    renderApp(`/quiz/${id}`)
    expect(await heading(title)).toBeInTheDocument()
  })

  it.each(['/learn/abc', '/learn/999', '/learn/1.5', '/labs/nope', '/quiz/nope'])(
    'renders 404 for invalid param %s',
    async (path) => {
      seedLearner()
      renderApp(path)
      expect(await heading('Page not found')).toBeInTheDocument()
    },
  )

  it('sends a guest to login and back after logging in', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/labs/lab-1')
    await heading('Log in')
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/labs/lab-1')}`)

    // Create the account through the register page, keeping next.
    await user.click(screen.getByRole('link', { name: 'Create an account' }))
    await heading('Create your account')
    await user.type(screen.getByLabelText('Full name'), LEARNER.name)
    await user.type(screen.getByLabelText('Email'), LEARNER.email)
    await user.type(screen.getByLabelText('Password'), LEARNER.password)
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await heading('Lab 1 title')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/labs/lab-1')
  })

  it('redirects a signed-in learner away from login', async () => {
    seedLearner()
    const { router } = renderApp('/login')
    expect(await heading(`Welcome back, ${LEARNER.name}`)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dashboard')
  })

  it('shows a focused error summary for an empty register form', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await heading('Create your account')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveFocus()
    expect(within(alert).getByText('Enter your name.')).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('counts come from the data', () => {
  it('updates the course page when the data changes', async () => {
    const data = cloneData()
    data.episodes.push(extraEpisode(6))
    data.quizzes.push({ ...data.quizzes[0]!, id: 'episode-6', episodeId: 6, title: 'E06 quiz' })
    renderApp('/course', data)
    await heading(data.course.title)
    const details = screen.getByRole('list', { name: 'Course details' })
    expect(within(details).getByText('6 videos')).toBeInTheDocument()
    // 6016 s (E01 measured 16:16 plus four catalog targets) + 300 s, approximate while targets are in use.
    expect(within(details).getByText('≈ 105 min in total')).toBeInTheDocument()
    expect(within(details).getByText('20 chapters')).toBeInTheDocument()
    expect(screen.getAllByText('6 episode quizzes and a final assessment').length).toBeGreaterThan(0)
  })

  it('updates dashboard totals when the data changes', async () => {
    const data = cloneData()
    data.episodes.push(extraEpisode(6))
    data.episodes.push({ ...extraEpisode(7), title: 'Bonus episode', optional: true })
    seedLearner({ completedEpisodes: [1] })
    renderApp('/dashboard', data)
    await heading(`Welcome back, ${LEARNER.name}`)
    // Shipped data has 5 required episodes; the extra required one makes 6, the optional one is counted apart.
    expect(screen.getByText('1 of 6 required episodes complete')).toBeInTheDocument()
    expect(screen.getByText('Optional: 0 of 1 episode complete')).toBeInTheDocument()
  })
})

describe('lessons', () => {
  it('marks a episode complete and keeps it after a remount', async () => {
    const user = userEvent.setup()
    seedLearner()
    const first = renderApp('/learn/1')
    await heading(title(1))
    await user.click(screen.getByRole('button', { name: 'Mark complete' }))
    expect(readProgress().completedEpisodes).toEqual([1])
    first.unmount()
    renderApp('/learn/1')
    await heading(title(1))
    expect(screen.getByRole('button', { name: 'Completed (undo)' })).toBeInTheDocument()
  })

  it('links each episode to its quiz, but not an episode without one', async () => {
    seedLearner()
    const a = renderApp('/learn/2')
    await heading(title(2))
    expect(screen.getByRole('link', { name: /Take the E02 quiz/ })).toHaveAttribute('href', '/quiz/episode-2')
    a.unmount()
    const data = cloneData()
    data.quizzes = data.quizzes.filter((q) => q.episodeId !== 5)
    renderApp('/learn/5', data)
    await heading(title(5))
    expect(screen.queryByText(/Take the/)).not.toBeInTheDocument()
  })

  it('reveals the check-yourself answer on request and hides it again', async () => {
    const user = userEvent.setup()
    seedLearner()
    renderApp('/learn/1')
    await heading(title(1))
    const check = courseData.episodes[0]!.check!
    const card = screen.getByRole('region', { name: 'Check yourself' })
    expect(within(card).getByText(check.question)).toBeVisible()
    const button = within(card).getByRole('button', { name: 'Reveal answer' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    const answer = document.getElementById(button.getAttribute('aria-controls')!)!
    expect(answer).not.toBeVisible()
    // No invented options: the card has one button and no radio choices.
    expect(within(card).queryAllByRole('radio')).toHaveLength(0)
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAccessibleName('Hide answer')
    expect(answer).toBeVisible()
    expect(answer).toHaveTextContent(`Answer: ${check.answer}`)
    await user.click(button)
    expect(answer).not.toBeVisible()
  })

  it('lists chapters without seek times for an episode that has no video yet', async () => {
    seedLearner()
    renderApp('/learn/2')
    await heading(title(2))
    const guide = screen.getByRole('region', { name: 'In this episode' })
    for (const label of ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4']) {
      expect(within(guide).getByText(label)).toBeInTheDocument()
    }
    expect(within(guide).getByText('4 chapters')).toBeInTheDocument()
    // Static list: no seek buttons and no m:ss times.
    expect(within(guide).queryByRole('button', { name: /Chapter 1/ })).not.toBeInTheDocument()
    expect(within(guide).queryByText(/^\d+:\d{2}$/)).not.toBeInTheDocument()
    for (const outcome of courseData.episodes[1]!.outcomes) expect(within(guide).getByText(outcome)).toBeInTheDocument()
  })

  it('lists the finished episode\'s chapters under the player with their start times', async () => {
    seedLearner()
    renderApp('/learn/1')
    await heading(title(1))
    const chapters = screen.getByRole('region', { name: 'Chapters' })
    const labels = ['What Bedrock is', 'Paying and getting in', 'The console map', 'The model menu']
    const times = ['0:00', '3:48', '7:32', '10:01']
    labels.forEach((label, i) => {
      expect(within(chapters).getByRole('button', { name: new RegExp(`${times[i]}\\s*${label}`) })).toBeInTheDocument()
    })
  })

  it('shows the catalog length as approximate until the real video length is known', async () => {
    seedLearner()
    const a = renderApp('/learn/3')
    await heading(title(3))
    expect(screen.getAllByText('≈ 20 min').length).toBeGreaterThan(0)
    expect(screen.getAllByText('about 20 minutes').length).toBeGreaterThan(0)
    a.unmount()
    renderApp('/learn/1')
    await heading(title(1))
    expect(screen.getAllByText('16:16').length).toBeGreaterThan(0)
  })
})

describe('labs', () => {
  it('persists ticked steps after a remount and reports completion', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    seedLearner()
    const first = renderApp('/labs/lab-1')
    await heading('Lab 1 title')
    await user.click(screen.getByRole('checkbox', { name: /Step 1/ }))
    await user.click(screen.getByRole('checkbox', { name: /Step 2/ }))
    expect(readProgress().labSteps['lab-1']).toEqual(['step-1', 'step-2'])
    first.unmount()
    renderApp('/labs/lab-1')
    await heading('Lab 1 title')
    expect(screen.getByRole('checkbox', { name: /Step 1/ })).toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: /Step 3/ }))
    expect(success).toHaveBeenCalledWith('Lab complete: Lab 1 title')
  })

  it('shows the untested callout and copies code', async () => {
    const user = userEvent.setup()
    const success = vi.spyOn(toast, 'success')
    seedLearner()
    renderApp('/labs/lab-2')
    await heading('Lab 2 title')
    expect(screen.getByText('Untested')).toBeInTheDocument()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await user.click(screen.getByRole('button', { name: 'Copy: Command for step 2' }))
    expect(writeText).toHaveBeenCalledWith('echo "Command goes here"')
    expect(success).toHaveBeenCalledWith('Copied to clipboard')
  })

  it('shows an error toast when copying fails', async () => {
    const user = userEvent.setup()
    const error = vi.spyOn(toast, 'error')
    seedLearner()
    renderApp('/labs/lab-2')
    await heading('Lab 2 title')
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await user.click(screen.getByRole('button', { name: 'Copy: Code for step 3' }))
    expect(error).toHaveBeenCalledWith('Copy failed. Select the code and copy it manually.')
    expect(screen.getByRole('region', { name: /Code for step 3/ })).toHaveTextContent('Placeholder')
  })
})

describe('quizzes', () => {
  it('keeps submit disabled until every question is answered, then grades and focuses the result', async () => {
    const user = userEvent.setup()
    seedLearner()
    renderApp('/quiz/episode-1')
    await heading('E01 quiz')
    const submit = screen.getByRole('button', { name: 'Submit answers' })
    expect(submit).toBeDisabled()
    const groups = screen.getAllByRole('group')
    await user.click(within(groups[0]!).getByLabelText('Correct answer'))
    await user.click(within(groups[1]!).getByLabelText('Correct answer'))
    expect(submit).toBeDisabled()
    await user.click(within(groups[2]!).getByLabelText('Wrong answer A'))
    expect(submit).toBeEnabled()
    await user.click(submit)
    const result = await screen.findByRole('heading', { name: 'Not passed yet' })
    expect(result).toHaveFocus()
    expect(readProgress().quizzes['episode-1']).toMatchObject({ best: 2, passed: false })

    await user.click(screen.getByRole('button', { name: 'Retake quiz' }))
    for (const group of screen.getAllByRole('group')) {
      await user.click(within(group).getByLabelText('Correct answer'))
    }
    await user.click(screen.getByRole('button', { name: 'Submit answers' }))
    expect(await screen.findByRole('heading', { name: 'Passed' })).toBeInTheDocument()
    expect(readProgress().quizzes['episode-1']).toMatchObject({ best: 3, attempts: 2, passed: true })
  })

  it('locks the final until every episode quiz is passed', async () => {
    seedLearner({ quizzes: { 'episode-1': { best: 3, last: 3, attempts: 1, passed: true } } })
    renderApp('/quiz/final')
    await heading('Final assessment')
    expect(screen.getByText('Locked until you pass every episode quiz')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'E02 quiz' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'E01 quiz' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit answers' })).not.toBeInTheDocument()
  })
})

describe('certificate', () => {
  it('stays locked and lists what is left', async () => {
    seedLearner({ completedEpisodes: [1] })
    renderApp('/certificate')
    await heading('Certificate')
    expect(screen.getByRole('link', { name: `Complete ${title(2)}` })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pass the Final assessment' })).toBeInTheDocument()
  })

  it('issues once, survives a remount, and a second tab gets the same record', async () => {
    seedLearner(completeProgress())
    const first = renderApp('/certificate')
    await heading('Your certificate')
    const stored = readProgress().certificate
    expect(stored).toMatchObject({ id: certificateFor().id, name: LEARNER.name, email: LEARNER.email })
    expect(screen.getByTestId('certificate')).toHaveTextContent(LEARNER.name)
    expect(screen.getByTestId('certificate')).toHaveTextContent(stored!.id)
    first.unmount()

    renderApp('/certificate')
    await heading('Your certificate')
    expect(readProgress().certificate).toEqual(stored)
  })

  it('ignores a forged certificate and issues the real one', async () => {
    seedLearner({ ...completeProgress(), certificate: { ...certificateFor(), id: 'AWB-AAAA-AAAA' } })
    renderApp('/certificate')
    await heading('Your certificate')
    expect(readProgress().certificate?.id).toBe(certificateFor().id)
  })
})

describe('dashboard', () => {
  it('shows the empty state for a new learner', async () => {
    seedLearner()
    renderApp('/dashboard')
    await heading(`Welcome back, ${LEARNER.name}`)
    expect(screen.getByText('You have not started yet')).toBeInTheDocument()
  })

  it('resets progress after confirmation', async () => {
    const user = userEvent.setup()
    seedLearner({ completedEpisodes: [1, 2] })
    renderApp('/dashboard')
    await heading(`Welcome back, ${LEARNER.name}`)
    await user.click(screen.getByRole('button', { name: 'Reset progress' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset progress' }))
    await waitFor(() => expect(screen.getByText('You have not started yet')).toBeInTheDocument())
    expect(window.localStorage.getItem(`awb:v1:progress:${LEARNER.email}`)).toBeNull()
  })

  it('refreshes when another tab changes storage', async () => {
    seedLearner()
    renderApp('/dashboard')
    await heading(`Welcome back, ${LEARNER.name}`)
    window.localStorage.setItem(
      `awb:v1:progress:${LEARNER.email}`,
      JSON.stringify({ completedEpisodes: [1], labSteps: {}, quizzes: {}, certificate: null }),
    )
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: `awb:v1:progress:${LEARNER.email}` }))
    })
    expect(await screen.findByText('1 of 5 required episodes complete')).toBeInTheDocument()
  })
})
