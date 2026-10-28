import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const R = 26
const C = 2 * Math.PI * R

/**
 * Circular progress with a text equivalent. Fills from 0 to its value once mounted (700 ms); under
 * reduced motion it renders the final value with no transition.
 */
export function ProgressRing({
  value,
  max,
  label,
  className,
}: {
  value: number
  max: number
  label: string
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const [shown, setShown] = useState(reduced ? ratio : 0)

  useEffect(() => {
    if (reduced) {
      setShown(ratio)
      return
    }
    const frame = requestAnimationFrame(() => setShown(ratio))
    return () => cancelAnimationFrame(frame)
  }, [ratio, reduced])

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
      className={cn('relative inline-flex size-20 shrink-0 items-center justify-center', className)}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" stroke="var(--color-muted)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="var(--color-progress)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - shown)}
          data-testid="ring-fill"
          className={reduced ? undefined : 'ring-fill--animate'}
        />
      </svg>
      <span className="relative font-mono text-sm font-semibold">{Math.round(ratio * 100)}%</span>
    </div>
  )
}
