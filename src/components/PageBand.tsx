import type { ReactNode } from 'react'
import { PageHeading } from '@/components/PageHeading'
import { cn } from '@/lib/utils'

/**
 * Page header band (DESIGN.md "Page bands"): ink surface, optional cover photo under a scrim, mono
 * eyebrow with the episode's accent bar, the page h1 in the display face, a lede and free slots.
 * Everything inside is in the ink scope, so buttons, badges and links render in their on-ink form.
 * `figure` (large screens only) shows the cover unscrimmed in a framed window on the right.
 */
export function PageBand({
  title,
  heading,
  top,
  eyebrow,
  lede,
  cover,
  accent,
  figure,
  size = 'md',
  children,
  className,
}: {
  /** Document title and the h1's accessible text. */
  title: string
  /** Custom h1 content; defaults to `title`. */
  heading?: ReactNode
  /** Above the eyebrow, for a back link. */
  top?: ReactNode
  eyebrow?: ReactNode
  lede?: ReactNode
  cover?: { src: string; srcSet?: string }
  /** Accent bar class, for example `bg-theme-glass`; volt when omitted. */
  accent?: string
  figure?: { src: string; srcSet?: string }
  size?: 'md' | 'lg'
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={cn('ink-scope on-ink relative isolate overflow-hidden bg-ink', className)}>
      {cover ? (
        <img
          src={cover.src}
          srcSet={cover.srcSet}
          sizes="100vw"
          alt=""
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      ) : null}
      <div aria-hidden="true" className="band-scrim pointer-events-none absolute inset-0 -z-10" />
      <div
        className={cn(
          'relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:px-8',
          size === 'lg' ? 'py-14 md:py-20' : 'py-10 md:py-14',
          figure && 'lg:grid-cols-[1fr_22rem]',
        )}
      >
        <div className="min-w-0">
          {top}
          {eyebrow ? (
            <p className="flex items-center gap-3 font-mono text-sm font-semibold text-volt">
              <span aria-hidden="true" className={cn('h-1 w-8 shrink-0 rounded-full', accent ?? 'bg-volt')} />
              {eyebrow}
            </p>
          ) : null}
          <PageHeading
            title={title}
            className={cn(
              'font-extrabold text-on-ink',
              eyebrow && 'mt-4',
              size === 'lg' ? 'text-[38px] leading-[1.02] md:text-[60px]' : 'text-[32px] leading-[1.05] md:text-[48px]',
            )}
          >
            {heading ?? title}
          </PageHeading>
          {lede ? <p className="mt-4 max-w-[60ch] text-lg text-on-ink-muted md:text-xl">{lede}</p> : null}
          {children}
        </div>
        {figure ? (
          <div aria-hidden="true" className="relative hidden lg:block">
            <img
              src={figure.src}
              srcSet={figure.srcSet}
              sizes="22rem"
              alt=""
              decoding="async"
              width={1280}
              height={720}
              className="aspect-[4/3] w-full rounded-panel border border-ink-line object-cover shadow-lift"
            />
            <span className={cn('absolute -bottom-2 left-6 h-1 w-16 rounded-full', accent ?? 'bg-volt')} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
