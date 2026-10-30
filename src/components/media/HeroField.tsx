import { useEffect, useRef, useState, type RefObject } from 'react'
import { useBackgroundMotionSetting, usePrefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { HeroField as Field } from './heroFieldGL'
import { HERO_POSTER } from './partCovers'

type Status = 'loading' | 'ready' | 'lost' | 'unsupported'

/**
 * Home hero background (DESIGN.md "Interactive hero"): a real-time WebGL "data landscape" drawn by
 * heroFieldGL, which is imported on demand so the hero copy and calls to action render first; the canvas
 * fades in once its first frame is drawn.
 *
 * - Fine pointer: the field bulges and lights up in volt under the cursor; the copy layer drifts a few px.
 * - Touch: ambient motion plus a ripple on tap; no pointer tracking.
 * - Footer "Background motion" off: the field pauses on its current frame (WCAG 2.2.2).
 * - Reduced motion: one still frame, no loop, no pointer tracking.
 * - No WebGL, or the GPU drops the context: a static poster rendered from the same shader.
 *
 * Decorative: aria-hidden, pointer-events none. No pause or play control on the hero (user requirement).
 */
export function HeroField({ hostRef }: { hostRef: RefObject<HTMLElement | null> }) {
  const reduced = usePrefersReducedMotion()
  const enabled = useBackgroundMotionSetting()
  const animate = enabled && !reduced
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fieldRef = useRef<Field | null>(null)
  const animateRef = useRef(animate)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    animateRef.current = animate
    fieldRef.current?.setAnimate(animate)
  }, [animate])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let cancelled = false
    import('./heroFieldGL')
      .then(({ createHeroField }) => {
        if (cancelled) return
        const field = createHeroField(canvas, host, {
          animate: animateRef.current,
          finePointer: window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false,
          onReady: () => setStatus('ready'),
          onLost: () => setStatus('lost'),
          onRestored: () => setStatus('ready'),
        })
        fieldRef.current = field
        if (!field) setStatus('unsupported')
      })
      .catch(() => {
        if (!cancelled) setStatus('unsupported')
      })
    return () => {
      cancelled = true
      fieldRef.current?.destroy()
      fieldRef.current = null
    }
  }, [hostRef])

  const showPoster = status === 'unsupported' || status === 'lost'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-ink">
      {status !== 'unsupported' ? (
        <canvas
          ref={canvasRef}
          data-testid="hero-field"
          data-state={status}
          className={cn(
            'hero-field absolute inset-0 size-full',
            status === 'ready' ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : null}
      {showPoster ? (
        <img
          src={HERO_POSTER.src}
          srcSet={HERO_POSTER.srcSet}
          sizes="100vw"
          alt=""
          decoding="async"
          data-testid="hero-poster"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </div>
  )
}
