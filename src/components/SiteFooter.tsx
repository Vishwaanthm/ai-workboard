import { Link } from 'react-router'
import { setBackgroundMotion, useBackgroundMotionSetting, usePrefersReducedMotion } from '@/lib/motion'
import { BrandMark } from './BrandMark'

/**
 * Pauses or resumes the decorative background motion site-wide (the Home hero field and the model strip).
 * Hidden when the system reduces motion: nothing loops then.
 */
function BackgroundMotionToggle() {
  const on = useBackgroundMotionSetting()
  const reduced = usePrefersReducedMotion()
  if (reduced) return null
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setBackgroundMotion(!on)}
      className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-2 text-sm font-medium text-on-ink-muted transition-colors duration-[120ms] hover:text-on-ink"
    >
      <span aria-hidden="true" className={on ? 'size-2 rounded-full bg-volt' : 'size-2 rounded-full border border-on-ink-muted'} />
      Background motion {on ? 'on' : 'off'}
    </button>
  )
}

export function SiteFooter() {
  return (
    <footer className="no-print on-ink mt-auto bg-ink">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div className="max-w-xl">
          <BrandMark onInk />
          <p className="mt-3 text-sm text-on-ink-muted">
            Amazon Web Services, AWS and Amazon Bedrock are trademarks of Amazon.com, Inc. or its affiliates.
            AI Workboard is not affiliated with or endorsed by AWS.
          </p>
          <p className="mt-3 text-sm text-on-ink-muted">
            Anthropic, Meta, Mistral AI, DeepSeek, Stability AI, Cohere and Luma names and marks belong to their
            owners and are shown only to identify their models. AI Workboard is not affiliated with or endorsed by
            them. Brand marks: Simple Icons (CC0).
          </p>
          <p className="mt-3 text-sm text-on-ink-muted">© 2026 AI Workboard</p>
          <BackgroundMotionToggle />
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-2 md:flex-col md:items-end">
          <Link to="/course" className="inline-flex min-h-11 items-center px-2 font-medium hover:text-volt">
            Course
          </Link>
          <Link to="/labs" className="inline-flex min-h-11 items-center px-2 font-medium hover:text-volt">
            Labs
          </Link>
          <Link to="/dashboard" className="inline-flex min-h-11 items-center px-2 font-medium hover:text-volt">
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  )
}
