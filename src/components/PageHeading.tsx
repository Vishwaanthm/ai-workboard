import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { cn } from '@/lib/utils'

let firstLocationSeen = false

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} | AI Workboard`
  }, [title])
}

/**
 * The page h1. Sets document.title and, after every in-app navigation (a new location key), takes focus
 * so keyboard and screen reader users start at the new page content. The very first page load keeps the
 * browser's default focus.
 */
export function PageHeading({
  title,
  children,
  className,
}: {
  title: string
  children?: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const { key, hash } = useLocation()
  useDocumentTitle(title)
  useEffect(() => {
    if (!firstLocationSeen) {
      firstLocationSeen = true
      return
    }
    // A #fragment link should land on its target, so the heading does not take focus then.
    if (hash) return
    ref.current?.focus({ preventScroll: true })
    // Only a new location should move focus; hash is read from the same render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className={cn('text-[28px] leading-[1.15] outline-none md:text-4xl', className)}
    >
      {children ?? title}
    </h1>
  )
}
