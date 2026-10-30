import { Eye, EyeOff, MessageCircleQuestion } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { EpisodeCheck } from '@/data/types'
import { cn } from '@/lib/utils'

/**
 * "Check yourself": the question the episode ends with and a disclosure button that reveals its answer
 * (button with aria-expanded/aria-controls; the answer region is `hidden` until revealed). No options are
 * shown: the catalog gives one question and one answer, nothing more.
 */
export function CheckYourself({ check, className }: { check: EpisodeCheck; className?: string }) {
  const [open, setOpen] = useState(false)
  const headingId = useId()
  const answerId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn('relative overflow-hidden rounded-panel border border-border bg-card p-5 shadow-raised md:p-6', className)}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-progress" />
      <h2 id={headingId} className="flex items-center gap-2 font-mono text-sm font-semibold tracking-normal text-muted-foreground">
        <MessageCircleQuestion aria-hidden="true" strokeWidth={1.75} className="size-5 text-link" />
        Check yourself
      </h2>
      <p className="mt-3 max-w-[60ch] font-display text-[22px] leading-[1.2] font-bold tracking-[-0.01em]">{check.question}</p>
      <Button
        variant="secondary"
        className="mt-5"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <EyeOff aria-hidden="true" strokeWidth={1.75} /> : <Eye aria-hidden="true" strokeWidth={1.75} />}
        {open ? 'Hide answer' : 'Reveal answer'}
      </Button>
      <div
        id={answerId}
        hidden={!open}
        className={cn('mt-4 rounded-control bg-primary-soft px-4 py-3', open && 'tab-panel-in')}
      >
        <p>
          <span className="font-semibold">Answer: </span>
          {check.answer}
        </p>
      </div>
    </section>
  )
}
