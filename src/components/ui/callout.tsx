import { AlertTriangle, CircleAlert, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const tones = {
  info: { box: 'border-primary/30 bg-primary-soft text-foreground', icon: Info, iconClass: 'text-primary' },
  caution: {
    box: 'border-accent/40 bg-accent-soft text-accent-soft-foreground',
    icon: AlertTriangle,
    iconClass: 'text-accent-soft-foreground',
  },
  error: {
    box: 'border-destructive/30 bg-destructive-soft text-destructive-soft-foreground',
    icon: CircleAlert,
    iconClass: 'text-destructive-soft-foreground',
  },
} as const

export function Callout({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones
  title: string
  children?: ReactNode
  className?: string
}) {
  const { box, icon: Icon, iconClass } = tones[tone]
  return (
    <div className={cn('flex gap-3 rounded-panel border p-4', box, className)}>
      <Icon aria-hidden="true" strokeWidth={1.75} className={cn('mt-0.5 size-5 shrink-0', iconClass)} />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-1">{children}</div> : null}
      </div>
    </div>
  )
}
