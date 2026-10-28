import { Link } from 'react-router'

/** Wordmark: a 2x2 grid glyph plus "AI Workboard (AWS)". Plain geometry, no illustration. */
export function BrandMark({ onNavigate, onInk }: { onNavigate?: () => void; onInk?: boolean }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className={`inline-flex min-h-11 items-center gap-2 rounded-control font-display text-[17px] font-bold tracking-[-0.02em] ${onInk ? 'text-on-ink' : 'text-foreground'}`}
      aria-label="AI Workboard (AWS), home"
    >
      <span aria-hidden="true" className={`grid size-5 grid-cols-2 gap-[2px] rounded-[4px] p-[3px] ${onInk ? 'bg-on-ink' : 'bg-primary'}`}>
        <span className={`rounded-[1px] ${onInk ? 'bg-ink' : 'bg-background'}`} />
        <span className={`rounded-[1px] ${onInk ? 'bg-ink' : 'bg-background'}`} />
        <span className={`rounded-[1px] ${onInk ? 'bg-ink' : 'bg-background'}`} />
        <span className="rounded-[1px] bg-volt" />
      </span>
      <span>
        AI Workboard <span className={`font-sans text-sm font-medium ${onInk ? 'text-on-ink-muted' : 'text-muted-foreground'}`}>(AWS)</span>
      </span>
    </Link>
  )
}
