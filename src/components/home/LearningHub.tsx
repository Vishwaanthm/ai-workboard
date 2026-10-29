import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { SmartLink } from '@/components/SmartLink'
import { Badge } from '@/components/ui/badge'
import type { HomeSections } from '@/data/types'
import { dateOrTba } from '@/lib/useCopy'
import { cn } from '@/lib/utils'

/** A card that is a link only when the data gives it somewhere to go (no dead links for placeholders). */
function MaybeLink({ href, className, children }: { href?: string; className: string; children: ReactNode }) {
  if (href) {
    return (
      <SmartLink href={href} className={cn('card-lift hover:border-foreground', className)}>
        {children}
      </SmartLink>
    )
  }
  return <div className={className}>{children}</div>
}

/**
 * Learning hub (placeholder copy from home.ts): intro and a link on the left with "What's new" cards
 * below, and an ink events list on the right. Missing dates read "TBA".
 */
export function LearningHub({ hub, headingId }: { hub: HomeSections['hub']; headingId: string }) {
  return (
    <div className="grid overflow-hidden rounded-panel border border-border bg-card shadow-raised lg:grid-cols-[1.45fr_1fr]">
      <div className="min-w-0 p-6 md:p-10">
        <h2 id={headingId} className="text-[30px] leading-[1.02] md:text-[44px]">
          Learning hub
        </h2>
        <p className="mt-4 max-w-[52ch] text-lg text-muted-foreground">{hub.lede}</p>
        <SmartLink href={hub.cta.href} className="link mt-5 inline-flex min-h-11 items-center gap-2">
          {hub.cta.label}
          <ArrowRight aria-hidden="true" strokeWidth={1.75} className="size-4" />
        </SmartLink>

        {hub.posts.length > 0 ? (
          <>
            <h3 className="mt-10 border-t border-border pt-6 font-mono text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              What's new
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {hub.posts.map((post, i) => (
                <Reveal as="li" index={i} key={post.id} className="min-w-0">
                  <MaybeLink
                    href={post.href}
                    className="flex h-full flex-col gap-3 rounded-panel border border-border bg-background p-4"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{post.kind}</Badge>
                      <span className="font-mono text-sm text-muted-foreground">{dateOrTba(post.date)}</span>
                    </span>
                    <span className="font-display text-lg leading-[1.15] font-bold">{post.title}</span>
                    <span className="text-sm text-muted-foreground">{post.text}</span>
                  </MaybeLink>
                </Reveal>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <div className="ink-scope on-ink min-w-0 bg-ink p-6 md:p-10">
        <h3 className="font-mono text-sm font-semibold tracking-[0.08em] text-volt uppercase">Events</h3>
        {hub.events.length > 0 ? (
          <ul className="mt-5 flex flex-col divide-y divide-ink-line border-y border-ink-line">
            {hub.events.map((ev) => {
              const body = (
                <>
                  <span className="flex items-center gap-2 font-mono text-sm text-volt">
                    <CalendarDays aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    <span>
                      <span className="sr-only">Date: </span>
                      {dateOrTba(ev.date)}
                    </span>
                  </span>
                  <span className="mt-2 block font-display text-lg leading-[1.15] font-bold text-on-ink">
                    {ev.title}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-sm text-on-ink-muted">
                    <MapPin aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                    {ev.location}
                  </span>
                </>
              )
              return (
                <li key={ev.id}>
                  {ev.href ? (
                    <SmartLink
                      href={ev.href}
                      className="block min-h-11 rounded-control py-4 transition-colors duration-[120ms] hover:bg-on-ink/5"
                    >
                      {body}
                    </SmartLink>
                  ) : (
                    <div className="py-4">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-5 text-on-ink-muted">No events scheduled yet.</p>
        )}
      </div>
    </div>
  )
}
