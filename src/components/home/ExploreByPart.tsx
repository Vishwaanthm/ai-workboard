import { ArrowRight } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { CodeBlock } from '@/components/CodeBlock'
import { coverFor } from '@/components/media/partCovers'
import { Badge } from '@/components/ui/badge'
import { episodesInPart } from '@/data'
import type { CourseData, PartSnippet } from '@/data/types'
import { cn, plural } from '@/lib/utils'
import { durationLabel, episodeLabel, spokenDurationLabel, totalDurationLabel } from '@/lib/watch'

/**
 * "Explore by part": one tab per course part (WAI-ARIA tabs, automatic activation). Roving tabindex:
 * only the selected tab is in the tab order; Left/Right move and select (wrapping), Home/End jump to the
 * first/last tab. Each panel shows the part's outcome and episodes from course data, a "Go to Part N"
 * link and the part's placeholder code panel from home.ts.
 */
export function ExploreByPart({ data, snippets }: { data: CourseData; snippets: PartSnippet[] }) {
  const baseId = useId()
  const [selected, setSelected] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const parts = data.parts
  if (parts.length === 0) return null

  const select = (i: number) => {
    setSelected(i)
    const tab = tabRefs.current[i]
    tab?.focus()
    // Keep the newly selected tab visible when the tab row scrolls sideways on small screens.
    tab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = parts.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1
    else if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    select(next)
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Course parts"
        aria-orientation="horizontal"
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 md:grid md:grid-cols-5 md:overflow-visible"
      >
        {parts.map((part, i) => {
          const isSelected = i === selected
          return (
            <button
              key={part.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${part.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${part.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'flex min-h-11 shrink-0 cursor-pointer snap-start flex-col items-start gap-1 rounded-panel border px-4 py-3 text-left transition-colors duration-[120ms]',
                isSelected
                  ? 'border-foreground bg-ink text-on-ink [--color-ring:var(--color-foreground)]'
                  : 'border-border bg-card text-foreground hover:border-foreground',
              )}
            >
              <span
                className={cn(
                  'flex items-center gap-2 font-mono text-sm',
                  isSelected ? 'text-on-ink-muted' : 'text-muted-foreground',
                )}
              >
                <span aria-hidden="true" className={cn('h-1 w-6 rounded-full', coverFor(part).accent)} />
                Part {part.id}
              </span>
              <span className="font-display text-base font-bold whitespace-nowrap md:whitespace-normal">
                {part.title}
              </span>
            </button>
          )
        })}
      </div>

      {parts.map((part, i) => {
        const eps = episodesInPart(data, part.id)
        const snippet = snippets.find((s) => s.partId === part.id)
        const isSelected = i === selected
        return (
          <div
            key={part.id}
            role="tabpanel"
            id={`${baseId}-panel-${part.id}`}
            aria-labelledby={`${baseId}-tab-${part.id}`}
            hidden={!isSelected}
            className={cn(
              'mt-4 grid gap-6 rounded-panel border border-border bg-card p-5 shadow-raised md:p-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10',
              isSelected && 'tab-panel-in',
            )}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
                <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', coverFor(part).accent)} />
                Part {part.id}
                {part.optional ? <Badge tone="outline">Optional</Badge> : null}
              </p>
              <h3 className="mt-3 font-display text-[26px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[32px]">
                {part.title}
              </h3>
              <p className="mt-3 max-w-[52ch] text-muted-foreground">{part.outcome}</p>
              {eps.length > 0 ? (
                <>
                  <p className="mt-6 text-sm font-semibold">
                    {plural(eps.length, 'episode')}, {totalDurationLabel(eps)}
                  </p>
                  <ol className="mt-2 divide-y divide-border border-y border-border">
                    {eps.map((ep) => (
                      <li key={ep.id} className="flex items-baseline gap-3 py-2.5">
                        <span className="w-9 shrink-0 font-mono text-sm text-muted-foreground">
                          {episodeLabel(ep.number)}
                        </span>
                        <span className="min-w-0 flex-1">{ep.title}</span>
                        <span className="shrink-0 font-mono text-sm text-muted-foreground">
                          <span aria-hidden="true">{durationLabel(ep.durationSec, ep.durationApprox)}</span>
                          <span className="sr-only">{spokenDurationLabel(ep.durationSec, ep.durationApprox)}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">Episodes for this part are coming soon.</p>
              )}
              <Link to={`/course#part-${part.id}`} className="link mt-6 inline-flex min-h-11 items-center gap-2">
                Go to Part {part.id}
                <ArrowRight aria-hidden="true" strokeWidth={1.75} className="size-4" />
              </Link>
            </div>
            {snippet ? (
              <div className="min-w-0 self-start">
                <CodeBlock label={snippet.label} lang={snippet.lang} code={snippet.code} />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
