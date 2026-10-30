import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProgressRing } from '@/components/art/ProgressRing'
import { Reveal } from '@/components/motion/Reveal'
import { courseData } from '@/data'
import { cloneData, renderApp, seedLearner } from './helpers'

/** Controllable matchMedia for '(prefers-reduced-motion: reduce)'. */
function mockReducedMotion(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes('prefers-reduced-motion') ? matches : false
    },
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
  return {
    set(value: boolean) {
      matches = value
      act(() => listeners.forEach((cb) => cb()))
    },
  }
}

/** IntersectionObserver that never reports an intersection until `trigger()` is called. */
function mockIntersectionObserver() {
  const callbacks: IntersectionObserverCallback[] = []
  class FakeIO {
    constructor(cb: IntersectionObserverCallback) {
      callbacks.push(cb)
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeIO)
  return {
    trigger() {
      act(() =>
        callbacks.forEach((cb) => cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)),
      )
    },
  }
}

const originalMatchMedia = window.matchMedia

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  vi.unstubAllGlobals()
})

describe('reduced motion', () => {
  it('shows the final static state of every motion component', () => {
    mockReducedMotion(true)
    mockIntersectionObserver()
    render(
      <>
        <Reveal>Revealed text</Reveal>
        <ProgressRing value={3} max={4} label="Done" />
      </>,
    )
    expect(screen.queryByRole('button', { name: /pause|play/i })).not.toBeInTheDocument()
    expect(screen.getByText('Revealed text')).toHaveAttribute('data-revealed', 'true')
    const fill = screen.getByTestId('ring-fill')
    expect(fill).not.toHaveClass('ring-fill--animate')
    expect(Number(fill.getAttribute('stroke-dashoffset'))).toBeCloseTo(2 * Math.PI * 26 * 0.25, 3)
  })

  it('reveals on scroll without the preference; no loop, no pause control', () => {
    mockReducedMotion(false)
    const io = mockIntersectionObserver()
    render(<Reveal>Waiting text</Reveal>)
    expect(screen.queryByRole('button', { name: /pause|play/i })).not.toBeInTheDocument()
    expect(screen.getByText('Waiting text')).toHaveAttribute('data-revealed', 'false')
    io.trigger()
    expect(screen.getByText('Waiting text')).toHaveAttribute('data-revealed', 'true')
  })

  it('never hides content when IntersectionObserver is unavailable', () => {
    mockReducedMotion(false)
    vi.stubGlobal('IntersectionObserver', undefined)
    // @ts-expect-error simulate an old browser
    delete window.IntersectionObserver
    render(<Reveal>Fallback text</Reveal>)
    expect(screen.getByText('Fallback text')).toHaveAttribute('data-revealed', 'true')
  })

  it('home hero: decorative background layer, no pause or play button, calls to action first', async () => {
    mockReducedMotion(false)
    mockIntersectionObserver()
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    // jsdom has no WebGL, so the field falls back to its static poster (the live field: hero-field.test.tsx).
    const poster = await screen.findByTestId('hero-poster')
    expect(poster.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(poster.parentElement!.className).toContain('pointer-events-none')
    expect(screen.queryByRole('button', { name: /pause|play/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Start the course' }).length).toBeGreaterThan(0)
  })

  it('home hero under reduced motion: no pause or play button and no footer switch', async () => {
    mockReducedMotion(true)
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    expect(screen.queryByRole('button', { name: /pause|play/i })).not.toBeInTheDocument()
    // The footer switch is not offered: there is nothing moving to stop.
    expect(screen.queryByRole('button', { name: /Background motion/ })).not.toBeInTheDocument()
  })

  it('footer "Background motion" switch is a toggle button and its choice is remembered', async () => {
    mockReducedMotion(false)
    mockIntersectionObserver()
    const user = userEvent.setup()
    const first = renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    const toggle = screen.getByRole('button', { name: 'Background motion on' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Background motion off' })).toHaveAttribute('aria-pressed', 'false')
    first.unmount()
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    expect(screen.getByRole('button', { name: 'Background motion off' })).toBeInTheDocument()
  })

  it('up next counts down and autoplays only without reduced motion; with it, waits for a click', async () => {
    const data = cloneData()
    data.episodes[0] = { ...data.episodes[0]!, videos: { en: '/videos/e01/en.mp4' } }
    const firstTitle = data.episodes[0].title
    seedLearner()

    mockReducedMotion(true)
    const first = renderApp('/learn/1', data)
    await screen.findByRole('heading', { level: 1, name: firstTitle })
    fireEvent.ended(screen.getByTestId('episode-video'))
    expect(screen.getByTestId('up-next')).toHaveTextContent('Up next: Episode 2')
    expect(screen.queryByText(/Starts in/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stay here' })).toBeInTheDocument()
    first.unmount()

    mockReducedMotion(false)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const second = renderApp('/learn/1', data)
    await screen.findByRole('heading', { level: 1, name: firstTitle })
    fireEvent.ended(screen.getByTestId('episode-video'))
    expect(screen.getByText('Starts in 5 s')).toBeInTheDocument()
    for (let s = 0; s < 6; s++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
    }
    expect(second.router.state.location.pathname).toBe('/learn/2')
    vi.useRealTimers()
  })
})
