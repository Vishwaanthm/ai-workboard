import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches
}

/** True when the user asked the system to reduce motion. Updates live if the setting changes. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/**
 * Reveal-once-on-scroll. Content is never hidden when motion is reduced or when
 * IntersectionObserver is unavailable: `revealed` is true from the first render in those cases.
 */
export function useReveal<T extends Element>(): { ref: RefObject<T | null>; revealed: boolean } {
  const ref = useRef<T>(null)
  const reduced = usePrefersReducedMotion()
  const supported = typeof window !== 'undefined' && 'IntersectionObserver' in window
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (reduced || !supported || seen) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced, supported, seen])

  return { ref, revealed: reduced || !supported || seen }
}

/*
 * Site-wide "Background motion" preference (WCAG 2.2.2 pause mechanism for the looping decorative
 * motion: the Home hero field and the model strip). Lives in the footer, not over the hero. Stored in
 * localStorage; default on. The storage key predates the rename and is kept so saved choices survive.
 */
const BG_KEY = 'aiw.backgroundVideo'
const bgListeners = new Set<() => void>()

function readBackgroundMotion(): boolean {
  try {
    return window.localStorage.getItem(BG_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setBackgroundMotion(on: boolean): void {
  try {
    window.localStorage.setItem(BG_KEY, on ? 'on' : 'off')
  } catch {
    // Storage blocked: the choice still applies until reload.
  }
  bgListeners.forEach((l) => l())
}

/** True when the user has decorative background motion switched on (the footer setting). */
export function useBackgroundMotionSetting(): boolean {
  return useSyncExternalStore(
    (cb) => {
      bgListeners.add(cb)
      return () => bgListeners.delete(cb)
    },
    readBackgroundMotion,
    () => true,
  )
}
