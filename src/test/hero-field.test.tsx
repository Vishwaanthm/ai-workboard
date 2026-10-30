import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroField } from '@/components/media/HeroField'
import { SiteFooter } from '@/components/SiteFooter'
import { setBackgroundMotion } from '@/lib/motion'

/** A WebGL context that records draw calls; constants are numbers, everything else is a no-op. */
function mockGL() {
  const calls: string[] = []
  let lost = false
  const loseContext = vi.fn(() => {
    lost = true
  })
  const gl = new Proxy({} as Record<string, unknown>, {
    get(_, key: string) {
      if (/^[A-Z_0-9]+$/.test(key)) return 1
      switch (key) {
        case 'isContextLost':
          return () => lost
        case 'getExtension':
          return (name: string) => (name === 'WEBGL_lose_context' ? { loseContext, restoreContext: () => {} } : null)
        case 'getShaderParameter':
        case 'getProgramParameter':
          return () => true
        case 'getAttribLocation':
          return () => 0
        case 'createShader':
        case 'createProgram':
        case 'createBuffer':
        case 'getUniformLocation':
          return () => ({})
        default:
          return () => {
            calls.push(key)
          }
      }
    },
  })
  const draws = () => calls.filter((c) => c === 'drawArrays' || c === 'drawElements').length
  return { gl, calls, draws, loseContext }
}

/** Serve the mock for WebGL2, or report no WebGL at all. */
function stubWebGL(gl: unknown) {
  return vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(((type: string) => (type === 'webgl2' ? gl : null)) as unknown as HTMLCanvasElement['getContext'])
}

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

function Hero({ footer = false }: { footer?: boolean }) {
  const hostRef = useRef<HTMLElement>(null)
  return (
    <MemoryRouter>
      <section ref={hostRef} data-testid="host">
        <HeroField hostRef={hostRef} />
        <p>Copy</p>
      </section>
      {footer ? <SiteFooter /> : null}
    </MemoryRouter>
  )
}

const ready = () => waitFor(() => expect(screen.getByTestId('hero-field')).toHaveAttribute('data-state', 'ready'))
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

describe('HeroField', () => {
  it('draws, loops with a capped pixel ratio, and follows a fine pointer', async () => {
    mockMedia()
    mockIO()
    const raf = mockRaf()
    const mock = mockGL()
    stubWebGL(mock.gl)
    render(<Hero />)
    await ready()
    const canvas = screen.getByTestId('hero-field') as HTMLCanvasElement
    expect(canvas.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(canvas.parentElement!.className).toContain('pointer-events-none')
    // jsdom lays the host out at 0x0; the canvas is sized at 1 CSS px times the DPR cap of 2.
    expect(canvas.width).toBe(2)
    expect(mock.draws()).toBeGreaterThan(0)
    expect(raf.pending()).toBe(true)

    const host = screen.getByTestId('host')
    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    const before = mock.draws()
    raf.step(16)
    raf.step(32)
    expect(mock.draws()).toBeGreaterThan(before)
    expect(host.style.getPropertyValue('--hx')).not.toBe('')
    expect(raf.pending()).toBe(true)
    expect(screen.queryByTestId('hero-poster')).not.toBeInTheDocument()
  })

  it('pauses off-screen, resumes on screen, and releases the GL context on unmount', async () => {
    mockMedia()
    const setVisible = mockIO()
    const raf = mockRaf()
    const mock = mockGL()
    stubWebGL(mock.gl)
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
    const { unmount } = render(<Hero />)
    await ready()
    const host = screen.getByTestId('host')
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
    expect(mock.loseContext).toHaveBeenCalledTimes(1)
    expect(host.style.getPropertyValue('--hx')).toBe('')
    expect(remove.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(['pointermove', 'pointerleave', 'pointerdown', 'webglcontextlost', 'webglcontextrestored']),
    )
  })

  it('touch: no pointer tracking; a tap is handled without tracking', async () => {
    mockMedia({ fine: false })
    mockIO()
    const raf = mockRaf()
    const mock = mockGL()
    stubWebGL(mock.gl)
    render(<Hero />)
    await ready()
    const host = screen.getByTestId('host')
    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    fireEvent.pointerDown(host, { clientX: 1, clientY: 1, pointerType: 'touch' })
    raf.step(16)
    raf.step(32)
    expect(host.style.getPropertyValue('--hx')).toBe('0.0000')
    expect(raf.pending()).toBe(true)
  })

  it('reduced motion: one crisp still frame, no loop, no pointer tracking', async () => {
    mockMedia({ reduced: true })
    mockIO()
    const raf = mockRaf()
    const mock = mockGL()
    stubWebGL(mock.gl)
    render(<Hero />)
    await ready()
    expect(mock.draws()).toBeGreaterThan(0)
    expect(raf.raf).not.toHaveBeenCalled()
    const host = screen.getByTestId('host')
    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    expect(raf.raf).not.toHaveBeenCalled()
    expect(host.style.getPropertyValue('--hx')).toBe('')
  })

  it('no WebGL: shows the static poster instead of a canvas', async () => {
    mockMedia()
    mockIO()
    const raf = mockRaf()
    stubWebGL(null)
    render(<Hero />)
    const poster = await screen.findByTestId('hero-poster')
    expect(poster).toHaveAttribute('alt', '')
    expect(poster.getAttribute('srcset')).toContain('2560w')
    expect(screen.queryByTestId('hero-field')).not.toBeInTheDocument()
    expect(raf.raf).not.toHaveBeenCalled()
  })

  it('context lost: falls back to the poster; restored: back to the live field', async () => {
    mockMedia()
    mockIO()
    const raf = mockRaf()
    const mock = mockGL()
    stubWebGL(mock.gl)
    render(<Hero />)
    await ready()
    const canvas = screen.getByTestId('hero-field')
    const lost = new Event('webglcontextlost', { cancelable: true })
    act(() => {
      canvas.dispatchEvent(lost)
    })
    expect(lost.defaultPrevented).toBe(true)
    expect(screen.getByTestId('hero-poster')).toBeInTheDocument()
    expect(raf.pending()).toBe(false)
    act(() => {
      canvas.dispatchEvent(new Event('webglcontextrestored'))
    })
    expect(screen.queryByTestId('hero-poster')).not.toBeInTheDocument()
    expect(canvas).toHaveAttribute('data-state', 'ready')
    expect(raf.pending()).toBe(true)
  })

  it('footer "Background motion" switch pauses the field on its frame and resumes it', async () => {
    mockMedia()
    mockIO()
    const raf = mockRaf()
    const mock = mockGL()
    stubWebGL(mock.gl)
    const user = userEvent.setup()
    render(<Hero footer />)
    await ready()
    raf.step(16)
    expect(raf.pending()).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Background motion on' }))
    expect(screen.getByRole('button', { name: 'Background motion off' })).toHaveAttribute('aria-pressed', 'false')
    expect(raf.pending()).toBe(false)
    expect(screen.getByTestId('hero-field')).toHaveAttribute('data-state', 'ready')
    // Paused: pointer input no longer moves anything.
    const host = screen.getByTestId('host')
    fireEvent.pointerMove(host, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    expect(raf.pending()).toBe(false)
    expect(host.style.getPropertyValue('--hx')).toBe('')

    await user.click(screen.getByRole('button', { name: 'Background motion off' }))
    expect(raf.pending()).toBe(true)
  })

  it('starts paused (one still frame) when motion was switched off earlier', async () => {
    mockMedia()
    mockIO()
    const raf = mockRaf()
    const mock = mockGL()
    stubWebGL(mock.gl)
    act(() => setBackgroundMotion(false))
    render(<Hero />)
    await ready()
    expect(mock.draws()).toBeGreaterThan(0)
    expect(raf.raf).not.toHaveBeenCalled()
  })
})
