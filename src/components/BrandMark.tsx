import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/**
 * Wordmark: a 2x2 grid glyph plus "AI Workboard (AWS)". The "(AWS)" label is set in the link colour
 * (volt on ink, lime-800 on paper) so the platform name reads as part of the brand, not as body text.
 */
export function BrandMark({ onNavigate, onInk }: { onNavigate?: () => void; onInk?: boolean }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-control font-display text-[17px] font-bold tracking-[-0.02em]',
        onInk ? 'text-on-ink' : 'text-foreground',
      )}
      aria-label="AI Workboard (AWS), home"
    >
      <span aria-hidden="true" className={cn('grid size-5 grid-cols-2 gap-[2px] rounded-[4px] p-[3px]', onInk ? 'bg-on-ink' : 'bg-primary')}>
        <span className={cn('rounded-[1px]', onInk ? 'bg-ink' : 'bg-background')} />
        <span className={cn('rounded-[1px]', onInk ? 'bg-ink' : 'bg-background')} />
        <span className={cn('rounded-[1px]', onInk ? 'bg-ink' : 'bg-background')} />
        <span className="rounded-[1px] bg-volt" />
      </span>
      <span>
        AI Workboard{' '}
        <span className={cn('font-mono text-sm font-semibold tracking-normal', onInk ? 'text-volt' : 'text-link')}>(AWS)</span>
      </span>
    </Link>
  )
}
