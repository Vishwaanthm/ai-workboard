import type { AwsIconName } from '@/data/types'
import { cn } from '@/lib/utils'
import { AWS_ICONS } from './awsIcons'

/**
 * Official AWS service icons for a lab (unmodified, lazy-loaded). Each icon carries the service name as
 * its alt text; with `withLabels` the name is also shown as text and the image becomes decorative.
 */
export function LabServiceIcons({
  services,
  size = 'md',
  withLabels = false,
  className,
}: {
  services?: AwsIconName[]
  size?: 'sm' | 'md' | 'lg'
  withLabels?: boolean
  className?: string
}) {
  if (!services || services.length === 0) return null
  const px = size === 'sm' ? 24 : size === 'md' ? 32 : 40
  return (
    <ul aria-label="AWS services used" className={cn('flex flex-wrap items-center gap-3', className)}>
      {services.map((name) => {
        const icon = AWS_ICONS[name]
        return (
          <li key={name} className="flex items-center gap-2">
            <img
              src={icon.src}
              alt={withLabels ? '' : icon.name}
              title={icon.name}
              width={px}
              height={px}
              loading="lazy"
              decoding="async"
              style={{ width: px, height: px }}
            />
            {withLabels ? <span className="text-sm font-medium">{icon.name}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}
