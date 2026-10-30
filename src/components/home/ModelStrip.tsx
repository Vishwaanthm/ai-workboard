import { AWS_ICONS } from '@/components/art/awsIcons'
import type { ModelProvider, ProviderMark } from '@/data/types'
import { asset } from '@/lib/asset'
import { useBackgroundMotionSetting, usePrefersReducedMotion } from '@/lib/motion'

/** Simple Icons files in public/brand-marks/ (CC0 files; the marks are trademarks of their owners). */
const MARK_FILES: Record<ProviderMark, string> = {
  anthropic: 'anthropic.svg',
  meta: 'meta.svg',
  mistral: 'mistralai.svg',
  deepseek: 'deepseek.svg',
}

/**
 * A brand mark in one flat colour: the unmodified SVG is used as a CSS mask over the text colour, so the
 * shape is the owner's and the colour follows the chip. Decorative: the provider name is always written.
 */
function Mark({ mark }: { mark: ProviderMark }) {
  const url = `url("${asset(`/brand-marks/${MARK_FILES[mark]}`)}")`
  return (
    <span
      aria-hidden="true"
      data-mark={mark}
      className="brand-mark size-5 shrink-0 bg-current"
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  )
}

function Chip({ provider }: { provider: ModelProvider }) {
  const icon = provider.service ? AWS_ICONS[provider.service] : undefined
  return (
    <span className="inline-flex min-h-12 items-center gap-3 rounded-panel border border-ink-line bg-ink-raised px-5 whitespace-nowrap text-on-ink">
      {provider.mark ? (
        <Mark mark={provider.mark} />
      ) : icon ? (
        <img src={icon.src} alt="" width={24} height={24} loading="lazy" decoding="async" className="size-6 shrink-0" />
      ) : (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-volt" />
      )}
      <span className="font-display text-lg font-bold tracking-[-0.01em] md:text-xl">{provider.name}</span>
      {provider.models && provider.models.length > 0 ? (
        <span className="text-sm text-on-ink-muted">{provider.models.join(', ')}</span>
      ) : null}
    </span>
  )
}

/**
 * Provider chips: the name, the model names the catalog gives, and a monochrome brand mark where Simple
 * Icons has one (the official Amazon Nova icon for Amazon). Moving: an endless left scroll made of two
 * identical tracks (the second is aria-hidden), paused while hovered or focused (the strip is a
 * focusable region). Static: a centred wrapped list when the system asks for reduced motion or the
 * footer "Background motion" switch (the site's pause control for decorative loops, WCAG 2.2.2) is off.
 */
export function ModelStrip({ providers }: { providers: ModelProvider[] }) {
  const reduced = usePrefersReducedMotion()
  const loopsOn = useBackgroundMotionSetting()
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
          <li key={p.name}>
            <Chip provider={p} />
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
                <li key={p.name}>
                  <Chip provider={p} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
