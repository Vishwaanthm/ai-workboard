import { useEffect, useRef } from 'react'
import { useBackgroundVideoSetting, usePrefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Decorative full-bleed background video: muted, looping, no controls, hidden from assistive tech.
 * Shows only the poster image when the user prefers reduced motion or turned background video off
 * (footer setting). Pauses when scrolled off-screen or when the tab is hidden.
 */
export function BackgroundVideo({
  mp4,
  webm,
  poster,
  className,
}: {
  mp4: string
  webm?: string
  poster: string
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  const enabled = useBackgroundVideoSetting()
  const play = enabled && !reduced
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!play || !video) return
    let visible = true
    const sync = () => {
      if (visible && document.visibilityState === 'visible') {
        void video.play?.()?.catch?.(() => {})
      } else {
        video.pause?.()
      }
    }
    let observer: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting)
        sync()
      })
      observer.observe(video)
    }
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [play])

  const media = 'absolute inset-0 size-full object-cover'
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {play ? (
        <video
          ref={ref}
          className={media}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          tabIndex={-1}
          data-testid="bg-video"
        >
          {webm ? <source src={webm} type="video/webm" /> : null}
          <source src={mp4} type="video/mp4" />
        </video>
      ) : (
        <img src={poster} alt="" className={media} data-testid="bg-poster" fetchPriority="high" />
      )}
    </div>
  )
}
