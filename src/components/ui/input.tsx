import type { InputHTMLAttributes, LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-control border border-input bg-card px-3 py-2 text-base text-foreground',
        'placeholder:text-muted-foreground aria-[invalid=true]:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export function Label({
  className,
  htmlFor,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { htmlFor: string }) {
  return <label htmlFor={htmlFor} className={cn('text-base font-medium text-foreground', className)} {...props} />
}
