import type { CSSProperties, ReactNode } from 'react'
import { useReveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

const MAX_STAGGER = 7

/**
 * Wraps content that fades, rises 12px and sharpens from a 4px blur once it scrolls into view.
 * `index` staggers siblings by 70 ms (capped at 8 steps). Never hides content under reduced motion.
 */
export function Reveal({
  children,
  index = 0,
  className,
  labelledBy,
  as: Tag = 'div',
}: {
  children: ReactNode
  index?: number
  className?: string
  /** id of the heading that names this element (use with as="section"). */
  labelledBy?: string
  as?: 'div' | 'li' | 'section'
}) {
  const { ref, revealed } = useReveal<HTMLElement>()
  const style = { '--stagger-i': Math.min(index, MAX_STAGGER) } as CSSProperties
  return (
    <Tag
      ref={ref as never}
      aria-labelledby={labelledBy}
      data-revealed={revealed ? 'true' : 'false'}
      className={cn('reveal', className)}
      style={style}
    >
      {children}
    </Tag>
  )
}
