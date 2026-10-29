import { CheckCircle2, Circle, CircleDashed } from 'lucide-react'
import type { LabStatus } from '@/lib/progress'

export function LabStatusLabel({ status, done, total }: { status: LabStatus; done: number; total: number }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-4 text-progress" />
        Done
      </span>
    )
  }
  if (status === 'in-progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <CircleDashed aria-hidden="true" strokeWidth={1.75} className="size-4 text-progress" />
        In progress, {done} of {total}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Circle aria-hidden="true" strokeWidth={1.75} className="size-4" />
      Not started
    </span>
  )
}
