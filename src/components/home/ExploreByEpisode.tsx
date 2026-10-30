import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { LabServiceIcons } from '@/components/art/LabServiceIcons'
import { CodeBlock } from '@/components/CodeBlock'
import { coverFor } from '@/components/media/covers'
import { Badge } from '@/components/ui/badge'
import type { CourseData, EpisodeSnippet } from '@/data/types'
import { cn, plural } from '@/lib/utils'
import { durationLabel, episodeLabel, spokenDurationLabel } from '@/lib/watch'

/**
 * "Explore by episode": one tab per episode (WAI-ARIA tabs, automatic activation). Roving tabindex:
 * only the selected tab is in the tab order; Left/Right move and select (wrapping), Home/End jump to the
 * first/last tab. Each panel shows the episode's "Covers" line, outcomes, chapters and AWS services from
 * course data, a "Go to E0N" link and the episode's placeholder code panel from home.ts.
 */
export function ExploreByEpisode({ data, snippets }: { data: CourseData; snippets: EpisodeSnippet[] }) {
  const baseId = useId()
  const [selected, setSelected] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const episodes = data.episodes
  if (episodes.length === 0) return null

  const select = (i: number) => {
    setSelected(i)
    const tab = tabRefs.current[i]
    tab?.focus()
    // Keep the newly selected tab visible when the tab row scrolls sideways on small screens.
    tab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = episodes.length - 1
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
        aria-label="Course episodes"
        aria-orientation="horizontal"
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 md:grid md:grid-cols-5 md:overflow-visible"
      >
        {episodes.map((ep, i) => {
          const isSelected = i === selected
          return (
            <button
              key={ep.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${ep.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${ep.id}`}
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
                <span aria-hidden="true" className={cn('h-1 w-6 rounded-full', coverFor(ep).accent)} />
                {episodeLabel(ep.number)}
              </span>
              <span className="max-w-[16rem] font-display text-base font-bold md:max-w-none">{ep.title}</span>
            </button>
          )
        })}
      </div>

      {episodes.map((ep, i) => {
        const snippet = snippets.find((s) => s.episodeId === ep.id)
        const isSelected = i === selected
        const chapters = ep.chapters ?? []
        return (
          <div
            key={ep.id}
            role="tabpanel"
            id={`${baseId}-panel-${ep.id}`}
            aria-labelledby={`${baseId}-tab-${ep.id}`}
            hidden={!isSelected}
            className={cn(
              'mt-4 grid gap-6 rounded-panel border border-border bg-card p-5 shadow-raised md:p-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10',
              isSelected && 'tab-panel-in',
            )}
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-3 font-mono text-sm text-muted-foreground">
                <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', coverFor(ep).accent)} />
                {episodeLabel(ep.number)}
                <span>
                  <span aria-hidden="true">{durationLabel(ep.durationSec, ep.durationApprox)}</span>
                  <span className="sr-only">{spokenDurationLabel(ep.durationSec, ep.durationApprox)}</span>
                </span>
                {ep.optional ? <Badge tone="outline">Optional</Badge> : null}
              </p>
              <h3 className="mt-3 font-display text-[26px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[32px]">
                {ep.title}
              </h3>
              <p className="mt-3 max-w-[52ch] text-muted-foreground">
                <span className="font-semibold text-foreground">Covers: </span>
                {ep.summary}
              </p>
              <p className="mt-6 text-sm font-semibold">You will be able to</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {ep.outcomes.map((o) => (
                  <li key={o} className="flex gap-2">
                    <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-progress" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
              {chapters.length > 0 ? (
                <>
                  <p className="mt-6 text-sm font-semibold">{plural(chapters.length, 'chapter')}</p>
                  <ol className="mt-2 divide-y divide-border border-y border-border">
                    {chapters.map((c, n) => (
                      <li key={c.label} className="flex items-baseline gap-3 py-2">
                        <span className="w-6 shrink-0 font-mono text-sm text-muted-foreground">{n + 1}</span>
                        <span className="min-w-0 flex-1">{c.label}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
              <Link to={`/course#episode-${ep.id}`} className="link mt-6 inline-flex min-h-11 items-center gap-2">
                Go to {episodeLabel(ep.number)}
                <ArrowRight aria-hidden="true" strokeWidth={1.75} className="size-4" />
              </Link>
            </div>
            <div className="flex min-w-0 flex-col gap-6 self-start">
              {ep.services && ep.services.length > 0 ? (
                <LabServiceIcons services={ep.services} withLabels />
              ) : null}
              {snippet ? <CodeBlock label={snippet.label} lang={snippet.lang} code={snippet.code} /> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
