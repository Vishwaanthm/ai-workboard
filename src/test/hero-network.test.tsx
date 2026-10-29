import { act, fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroNetwork } from '@/components/media/HeroNetwork'
import { setBackgroundVideo } from '@/lib/motion'

/** Records every 2D call the network makes; unknown methods are no-ops. */
function mockContext() {
  const calls: { name: string; args: unknown[] }[] = []
  const props: Record<string, unknown> = {}
  const ctx = new Proxy(props, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'createRadialGradient') return () => ({ addColorStop: () => {} })
      return (...args: unknown[]) => calls.push({ name: key, args })
    },
    set(target, key: string, value) {
      target[key] = value
      return true
    },
    has(_, key) {
      return key === 'roundRect' || key in props
    },
  })
  const count = (name: string) => calls.filter((c) => c.name === name).length
  return { ctx, calls, count }
}

/** matchMedia: reduced motion and fine pointer are switchable per test. */
function mockMedia({ reduced = false, fine = true } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : query.includes('pointer: fine') ? fine : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

/** IntersectionObserver driven by the test. */
function mockIO() {
  let callback: IntersectionObserverCallback | undefined
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return []
      }
    },
  )
  return (isIntersecting: boolean) =>
    act(() => callback?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver))
}

/** requestAnimationFrame that only runs when the test calls `step()`. */
function mockRaf() {
  let next: FrameRequestCallback | null = null
  let id = 0
  const raf = vi.fn((cb: FrameRequestCallback) => {
    next = cb
    return ++id
  })
  const cancel = vi.fn(() => {
    next = null
  })
  vi.stubGlobal('requestAnimationFrame', raf)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  return {
    raf,
    cancel,
    step(t: number) {
      const cb = next
      next = null
      act(() => cb?.(t))
    },
    pending: () => next !== null,
  }
}

function Hero() {
  const hostRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  return (
    <section ref={hostRef} data-testid="host">
      <HeroNetwork hostRef={hostRef} copyRef={copyRef} />
      <div ref={copyRef}>Copy</div>
    </section>
  )
}

const originalMatchMedia = window.matchMedia
const originalDpr = window.devicePixelRatio

beforeEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true })
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  Object.defineProperty(window, 'devicePixelRatio', { value: originalDpr, configurable: true })
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('HeroNetwork', () => {
  it('animates with a capped pixel ratio, follows a fine pointer, and knocks out behind the copy', () => {
    mockMedia()
    mockIO()
    const raf = mockRaf()
    const { ctx, count, calls } = mockContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    const { getByTestId } = render(<Hero />)
    const host = getByTestId('host')

    expect(calls.find((c) => c.name === 'setTransform')?.args).toEqual([2, 0, 0, 2, 0, 0])
    expect(raf.raf).toHaveBeenCalledTimes(1)
    raf.step(16)
    expect(count('clearRect')).toBe(1)
    expect(count('roundRect')).toBe(3)
    expect(ctx.globalCompositeOperation).toBe('source-over')

    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    raf.step(32)
    raf.step(48)
    expect(host.style.getPropertyValue('--hx')).not.toBe('')
    expect(raf.pending()).toBe(true)
  })

  it('pauses off-screen, resumes on screen, and cleans up on unmount', () => {
    mockMedia()
    const setVisible = mockIO()
    const raf = mockRaf()
    const { ctx } = mockContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
    const { getByTestId, unmount } = render(<Hero />)
    const host = getByTestId('host')
    raf.step(16)

    setVisible(false)
    expect(raf.cancel).toHaveBeenCalled()
    expect(raf.pending()).toBe(false)
    setVisible(true)
    expect(raf.pending()).toBe(true)

    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    raf.step(32)
    expect(host.style.getPropertyValue('--hx')).not.toBe('')
    unmount()
    expect(raf.pending()).toBe(false)
    expect(host.style.getPropertyValue('--hx')).toBe('')
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['pointermove', 'pointerleave', 'pointerdown']))
  })

  it('touch: no pointer tracking, a tap ripple still draws', () => {
    mockMedia({ fine: false })
    mockIO()
    const raf = mockRaf()
    const { ctx, count } = mockContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    const { getByTestId } = render(<Hero />)
    const host = getByTestId('host')
    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    raf.step(16)
    expect(host.style.getPropertyValue('--hx')).toBe('0.0000')
    const arcsBefore = count('arc')
    fireEvent.pointerDown(host, { clientX: 1, clientY: 1, pointerType: 'touch' })
    raf.step(32)
    // One more arc than the nodes alone: the ripple ring.
    expect(count('arc') - arcsBefore).toBeGreaterThan(arcsBefore)
  })

  it('background video switched off: one still frame, no animation loop, no listeners', () => {
    mockMedia()
    mockIO()
    const raf = mockRaf()
    const { ctx, count } = mockContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    act(() => setBackgroundVideo(false))
    const { getByTestId } = render(<Hero />)
    expect(raf.raf).not.toHaveBeenCalled()
    expect(count('clearRect')).toBe(1)
    const host = getByTestId('host')
    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    fireEvent.pointerDown(host, { clientX: 1, clientY: 1, pointerType: 'touch' })
    expect(raf.raf).not.toHaveBeenCalled()
    expect(host.style.getPropertyValue('--hx')).toBe('')
  })

  it('reduced motion: renders no canvas and never touches a context', () => {
    mockMedia({ reduced: true })
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    const raf = mockRaf()
    const { queryByTestId } = render(<Hero />)
    expect(queryByTestId('hero-network')).not.toBeInTheDocument()
    expect(getContext).not.toHaveBeenCalled()
    expect(raf.raf).not.toHaveBeenCalled()
  })
})
