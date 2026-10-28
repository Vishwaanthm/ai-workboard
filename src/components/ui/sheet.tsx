import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger

export function SheetContent({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-foreground/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-[min(22rem,100vw)] flex-col bg-card shadow-raised',
          'data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border py-2 pr-2 pl-4">
          <DialogPrimitive.Title className="font-mono text-lg font-semibold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-control transition-colors duration-[120ms] hover:bg-primary-soft"
            aria-label="Close"
          >
            <X aria-hidden="true" strokeWidth={1.75} className="size-5" />
          </DialogPrimitive.Close>
        </div>
        <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
