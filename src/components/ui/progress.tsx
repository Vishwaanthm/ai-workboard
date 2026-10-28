import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max: number
  /** Accessible name, for example "Course progress". */
  label: string
  className?: string
}

export function Progress({ value, max, label, className }: ProgressProps) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
      className={cn('h-2 w-full overflow-hidden rounded-control bg-muted', className)}
    >
      <div
        className="h-full w-full origin-left bg-progress transition-transform duration-[320ms] ease-out"
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  )
}
