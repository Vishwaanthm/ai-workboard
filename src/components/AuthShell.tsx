import type { ReactNode } from 'react'
import { coverFor, COURSE_COVER } from '@/components/media/partCovers'
import { useAppState } from '@/context/useAppState'
import { cn, plural } from '@/lib/utils'

/**
 * Split layout for Log in and Create account: on large screens an ink panel with the course image,
 * title and part spine sits beside the form; on small screens the form stands alone under the ink header.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { data } = useAppState()
  return (
    <div className="grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_1fr]">
      <aside
        aria-label="About the course"
        className="ink-scope on-ink relative isolate hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-end"
      >
        <img src={COURSE_COVER.src} alt="" decoding="async" className="absolute inset-0 -z-20 size-full object-cover" />
        <div aria-hidden="true" className="band-scrim absolute inset-0 -z-10" />
        <div className="max-w-xl p-12 xl:p-16">
          <p className="font-mono text-sm font-semibold text-volt">{data.course.level} course</p>
          <p className="mt-4 font-display text-[44px] leading-[1.02] font-extrabold tracking-[-0.03em]">
            {data.course.title}
          </p>
          <p className="mt-4 text-lg text-on-ink-muted">{data.course.summary}</p>
          <ul className="mt-8 flex flex-col gap-3">
            {data.parts.map((part) => (
              <li key={part.id} className="flex items-center gap-3 text-on-ink">
                <span aria-hidden="true" className={cn('h-1 w-8 shrink-0 rounded-full', coverFor(part).accent)} />
                <span className="font-mono text-sm text-on-ink-muted">Part {part.id}</span>
                <span className="font-medium">{part.title}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-on-ink-muted">{plural(data.episodes.length, 'video episode')}, labs, quizzes and a certificate.</p>
        </div>
      </aside>
      <div className="flex items-center px-4 py-12 sm:px-6 md:py-16 lg:px-12">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
