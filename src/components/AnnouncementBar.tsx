import { ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import { home } from '@/data/home'
import type { Announcement } from '@/data/types'
import { SmartLink } from './SmartLink'

export const ANNOUNCEMENT_KEY = 'aiw.announcement.dismissed'

function readDismissed(): string | null {
  try {
    return window.localStorage.getItem(ANNOUNCEMENT_KEY)
  } catch {
    return null
  }
}

/**
 * Site-wide bar above the header (volt band, ink text: 14.50:1). Dismissible; the dismissed announcement
 * id is remembered in localStorage, so a new id shows again. Renders nothing without an announcement.
 */
export function AnnouncementBar({ announcement = home.announcement }: { announcement?: Announcement | null }) {
  const [dismissed, setDismissed] = useState<string | null>(readDismissed)
  if (!announcement || dismissed === announcement.id) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(ANNOUNCEMENT_KEY, announcement.id)
    } catch {
      // Storage blocked: the bar stays hidden until reload.
    }
    setDismissed(announcement.id)
    // The focused button is about to disappear: continue from the page content.
    document.getElementById('main')?.focus({ preventScroll: true })
  }

  return (
    <section aria-label="Announcement" className="no-print bg-volt text-ink [--color-ring:var(--color-ink)]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 py-1 pr-1 pl-4 sm:px-6 lg:px-8">
        <p className="flex min-h-11 flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-0 py-1 text-center text-sm font-medium">
          <span>{announcement.text}</span>
          {announcement.link ? (
            <SmartLink
              href={announcement.link.href}
              className="group inline-flex min-h-11 items-center gap-1 font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {announcement.link.label}
              <ArrowRight
                aria-hidden="true"
                strokeWidth={1.75}
                className="size-4 transition-transform duration-[120ms] group-hover:translate-x-0.5"
              />
            </SmartLink>
          ) : null}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control transition-colors duration-[120ms] hover:bg-ink/10"
        >
          <X aria-hidden="true" strokeWidth={1.75} className="size-5" />
        </button>
      </div>
    </section>
  )
}
