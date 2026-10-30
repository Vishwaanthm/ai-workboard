import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { AWS_ICONS } from '@/components/art/awsIcons'
import { coverFor } from '@/components/media/covers'
import { Reveal } from '@/components/motion/Reveal'
import { getEpisode } from '@/data'
import type { CourseData, JourneyStep } from '@/data/types'
import { cn } from '@/lib/utils'
import { episodeLabel } from '@/lib/watch'

/**
 * The running story on ink: one step per episode, in course order, as a numbered path (a vertical line on
 * small screens, a row of five on wide ones). Each step names its episode code next to the episode accent,
 * the catalog's step text, the episode's official AWS service icons (alt = service name) and links to
 * that lesson.
 */
export function Journey({ data, steps }: { data: CourseData; steps: JourneyStep[] }) {
  return (
    <div className="relative">
      {/* The path: one hairline behind the step markers (decorative). */}
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-[1.1875rem] w-px bg-ink-line md:top-[1.1875rem] md:right-0 md:bottom-auto md:left-0 md:h-px md:w-auto"
      />
      <ol className="relative grid gap-4 md:grid-cols-5 md:gap-3">
      {steps.map((step, i) => {
        const episode = getEpisode(data, step.episodeId)
        if (!episode) return null
        const cover = coverFor(episode)
        return (
          <Reveal as="li" index={i} key={step.episodeId} className="relative min-w-0 pl-14 md:pl-0">
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-full border border-ink-line bg-ink font-mono text-sm font-semibold text-volt md:relative"
            >
              {i + 1}
            </span>
            <Link
              to={`/learn/${episode.id}`}
              className="usecase-card group flex h-full flex-col justify-between gap-6 rounded-panel border border-ink-line bg-ink-raised p-5 hover:border-on-ink-muted md:mt-4"
            >
              <span>
                <span className="flex items-center gap-3 font-mono text-sm text-on-ink-muted">
                  <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', cover.accent)} />
                  {episodeLabel(episode.number)}
                </span>
                <span className="mt-3 block font-display text-[22px] leading-[1.1] font-bold tracking-[-0.01em] text-on-ink">
                  {step.text}
                </span>
              </span>
              <span className="flex flex-col gap-4">
                {episode.services && episode.services.length > 0 ? (
                  <span className="flex flex-wrap gap-2">
                    {episode.services.map((name) => (
                      <img
                        key={name}
                        src={AWS_ICONS[name].src}
                        alt={AWS_ICONS[name].name}
                        title={AWS_ICONS[name].name}
                        width={28}
                        height={28}
                        loading="lazy"
                        decoding="async"
                        className="size-7"
                      />
                    ))}
                  </span>
                ) : null}
                <span className="inline-flex items-start gap-2 text-sm font-semibold text-volt">
                  {episode.title}
                  <ArrowRight
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="mt-0.5 size-4 shrink-0 transition-transform duration-[120ms] group-hover:translate-x-1"
                  />
                </span>
              </span>
            </Link>
          </Reveal>
        )
      })}
      </ol>
    </div>
  )
}
