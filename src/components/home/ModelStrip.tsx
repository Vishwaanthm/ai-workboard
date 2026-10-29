import { useBackgroundVideoSetting, usePrefersReducedMotion } from '@/lib/motion'

function Chip({ name }: { name: string }) {
  return (
    <span className="inline-flex min-h-12 items-center gap-3 rounded-panel border border-ink-line bg-ink-raised px-5 font-display text-lg font-bold tracking-[-0.01em] whitespace-nowrap text-on-ink md:text-xl">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-volt" />
      {name}
    </span>
  )
}

/**
 * Provider names as text chips (no third-party logos). Moving: an endless left scroll made of two
 * identical tracks (the second is aria-hidden), paused while hovered or focused (the strip is a
 * focusable region). Static: a centred wrapped list when the system asks for reduced motion or the
 * footer "Background video" switch (the site's pause control for decorative loops, WCAG 2.2.2) is off.
 */
export function ModelStrip({ providers }: { providers: string[] }) {
  const reduced = usePrefersReducedMotion()
  const loopsOn = useBackgroundVideoSetting()
  if (providers.length === 0) return null
  const moving = loopsOn && !reduced

  if (!moving) {
    return (
      <ul
        aria-label="Model providers"
        data-testid="model-strip"
        data-moving="false"
        className="flex flex-wrap justify-center gap-3"
      >
        {providers.map((p) => (
          <li key={p}>
            <Chip name={p} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      role="region"
      aria-label="Model providers, scrolling. Hover or focus to pause."
      tabIndex={0}
      data-testid="model-strip"
      data-moving="true"
      className="marquee rounded-panel"
    >
      {/* The edge fade lives on an inner layer so it never masks the region's focus ring. */}
      <div className="marquee-mask overflow-hidden py-1">
        <div className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
              aria-label={copy === 0 ? 'Model providers' : undefined}
              className="flex shrink-0 gap-3 pr-3"
            >
              {providers.map((p) => (
                <li key={p}>
                  <Chip name={p} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
