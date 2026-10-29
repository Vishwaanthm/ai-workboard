import { ArrowRight } from 'lucide-react'
import { AWS_ICONS } from '@/components/art/awsIcons'
import { coverFor } from '@/components/media/partCovers'
import { Reveal } from '@/components/motion/Reveal'
import { SmartLink } from '@/components/SmartLink'
import { getPart } from '@/data'
import type { CourseData, UseCase } from '@/data/types'
import { cn } from '@/lib/utils'

/** Asymmetric 6-column grid: 3+3, then 2+2+2 (no single row of equal cards across the width). */
const SPANS = ['md:col-span-3', 'md:col-span-3', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-6']

/**
 * "What you'll build" cards on ink (placeholder copy from home.ts). Each card carries its part's accent
 * next to the written "Part N" label, an optional official AWS icon with its service name (unmodified
 * file, alt="" because the name is visible) and links to the part unless the data sets another href.
 */
export function UseCases({ data, items }: { data: CourseData; items: UseCase[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-6">
      {items.map((item, i) => {
        const part = getPart(data, item.partId)
        const icon = item.service ? AWS_ICONS[item.service] : undefined
        return (
          <Reveal as="li" index={i} key={item.id} className={cn('min-w-0', SPANS[i % SPANS.length])}>
            <SmartLink
              href={item.href ?? `/course#part-${item.partId}`}
              className="usecase-card group flex h-full min-h-56 flex-col justify-between gap-8 rounded-panel border border-ink-line bg-ink-raised p-6 hover:border-on-ink-muted"
            >
              <span className="flex flex-wrap items-center justify-between gap-4">
                <span className="flex items-center gap-3 font-mono text-sm text-on-ink-muted">
                  <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', coverFor(part).accent)} />
                  Part {item.partId}
                </span>
                {icon ? (
                  <span className="flex items-center gap-2 text-sm text-on-ink-muted">
                    <img src={icon.src} alt="" width={28} height={28} className="size-7" />
                    {icon.name}
                  </span>
                ) : null}
              </span>
              <span>
                <span className="block font-display text-[22px] leading-[1.1] font-bold tracking-[-0.01em] text-on-ink md:text-[26px]">
                  {item.title}
                </span>
                <span className="mt-2 block max-w-[52ch] text-on-ink-muted">{item.text}</span>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-volt">
                  {part ? `Part ${part.id}: ${part.title}` : 'View the course'}
                  <ArrowRight
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="size-4 transition-transform duration-[120ms] group-hover:translate-x-1"
                  />
                </span>
              </span>
            </SmartLink>
          </Reveal>
        )
      })}
    </ul>
  )
}
