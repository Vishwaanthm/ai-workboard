import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HubArt } from '@/components/art/HubArt'
import { PART_MOTIFS, PartMotif } from '@/components/art/PartMotif'
import { ProgressRing } from '@/components/art/ProgressRing'
import { SectionBackdrop } from '@/components/art/SectionBackdrop'
import { Reveal } from '@/components/motion/Reveal'
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
        <HubArt />
        <Reveal>Revealed text</Reveal>
        <SectionBackdrop variant="topo" />
        <ProgressRing value={3} max={4} label="Done" />
      </>,
    )
    expect(screen.queryByTestId('hub-flow')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause animation' })).not.toBeInTheDocument()
    expect(screen.getByTestId('hub-art')).not.toHaveClass('hub-art--animate')
    expect(screen.getByText('Revealed text')).toHaveAttribute('data-revealed', 'true')
    expect(screen.getByTestId('topo-backdrop')).not.toHaveClass('backdrop-topo--draw')
    const fill = screen.getByTestId('ring-fill')
    expect(fill).not.toHaveClass('ring-fill--animate')
    expect(Number(fill.getAttribute('stroke-dashoffset'))).toBeCloseTo(2 * Math.PI * 26 * 0.25, 3)
  })

  it('animates without the preference, with a working pause toggle, and stops when the preference turns on', async () => {
    const media = mockReducedMotion(false)
    const io = mockIntersectionObserver()
    const user = userEvent.setup()
    render(
      <>
        <HubArt />
        <Reveal>Waiting text</Reveal>
      </>,
    )
    expect(screen.getByTestId('hub-flow')).toBeInTheDocument()
    expect(screen.getByText('Waiting text')).toHaveAttribute('data-revealed', 'false')
    io.trigger()
    expect(screen.getByText('Waiting text')).toHaveAttribute('data-revealed', 'true')

    const toggle = screen.getByRole('button', { name: 'Pause animation' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('hub-art')).toHaveClass('hub-art--paused')

    media.set(true)
    expect(screen.queryByTestId('hub-flow')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause animation' })).not.toBeInTheDocument()
  })

  it('never hides content when IntersectionObserver is unavailable', () => {
    mockReducedMotion(false)
    vi.stubGlobal('IntersectionObserver', undefined)
    // @ts-expect-error simulate an old browser
    delete window.IntersectionObserver
    render(<Reveal>Fallback text</Reveal>)
    expect(screen.getByText('Fallback text')).toHaveAttribute('data-revealed', 'true')
  })

  it('keeps art accessible: labelled hub, hidden decoration, fixed aspect ratios', () => {
    mockReducedMotion(true)
    const { container } = render(
      <>
        <HubArt />
        <SectionBackdrop variant="grid" />
        <SectionBackdrop variant="topo" />
        {PART_MOTIFS.map((m) => (
          <PartMotif key={m} motif={m} />
        ))}
      </>,
    )
    const hub = screen.getByRole('img', { name: /Amazon Bedrock is one API/ })
    expect(hub).toHaveAttribute('viewBox')
    expect(container.querySelectorAll('[data-motif]')).toHaveLength(6)
    for (const el of container.querySelectorAll('[data-motif], [data-testid="topo-backdrop"], .backdrop-grid')) {
      expect(el).toHaveAttribute('aria-hidden', 'true')
      expect(el.getAttribute('class')).toContain('pointer-events-none')
    }
  })

  it('up next counts down and autoplays only without reduced motion; with it, waits for a click', async () => {
    const data = cloneData()
    data.episodes[0] = { ...data.episodes[0]!, videos: { en: '/videos/e01/en.mp4' } }
    seedLearner()

    mockReducedMotion(true)
    const first = renderApp('/learn/1', data)
    await screen.findByRole('heading', { level: 1, name: 'Episode 1 title' })
    fireEvent.ended(screen.getByTestId('episode-video'))
    expect(screen.getByTestId('up-next')).toHaveTextContent('Up next: Episode 2')
    expect(screen.queryByText(/Starts in/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stay here' })).toBeInTheDocument()
    first.unmount()

    mockReducedMotion(false)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const second = renderApp('/learn/1', data)
    await screen.findByRole('heading', { level: 1, name: 'Episode 1 title' })
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
