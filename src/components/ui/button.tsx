import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-control',
    'text-base font-medium select-none',
    'transition-[color,background-color,border-color,transform] duration-[120ms] ease-out',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'border border-input bg-card text-foreground hover:bg-primary-soft',
        ghost: 'text-foreground hover:bg-primary-soft',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-soft-foreground',
        link: 'px-0 text-primary underline-offset-4 hover:underline active:scale-100',
        volt: 'bg-volt font-semibold text-ink hover:bg-volt-hover',
        ghostInk: 'border border-on-ink-muted/60 text-on-ink hover:border-on-ink hover:bg-on-ink/10',
      },
      size: {
        md: 'min-h-11 px-4 py-2',
        lg: 'min-h-12 px-6 py-3',
        icon: 'size-11',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  )
}
