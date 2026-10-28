import { useReveal, usePrefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Original decorative layers placed behind section content (the section needs `relative isolate
 * overflow-hidden`). `grid`: a fine line grid faded out by a radial mask. `topo`: topographic contour
 * lines that draw in once when the section scrolls into view. Static under reduced motion.
 */

const TOPO_PATHS = [
  'M -20 330 C 80 250 180 300 260 250 S 420 150 520 190 S 640 160 700 120',
  'M -20 360 C 90 285 190 330 270 285 S 430 185 530 222 S 650 196 700 158',
  'M -20 392 C 100 322 200 362 280 320 S 440 222 540 256 S 660 232 700 196',
  'M -20 424 C 110 360 210 394 290 356 S 450 260 550 290 S 670 268 700 234',
  'M -20 456 C 120 398 220 426 300 392 S 460 298 560 324 S 680 304 700 272',
  'M 380 40 C 430 20 500 30 540 70 S 600 150 560 180 S 470 190 430 150 S 350 60 380 40 Z',
  'M 410 64 C 445 50 492 58 520 86 S 562 140 536 160 S 474 168 446 140 S 392 80 410 64 Z',
]

export function SectionBackdrop({ variant, className }: { variant: 'grid' | 'topo'; className?: string }) {
  const reduced = usePrefersReducedMotion()
  const { ref, revealed } = useReveal<SVGSVGElement>()

  if (variant === 'grid') {
    return <div aria-hidden="true" className={cn('backdrop-grid pointer-events-none absolute inset-0 -z-10', className)} />
  }

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 680 480"
      preserveAspectRatio="xMidYMid slice"
      data-testid="topo-backdrop"
      className={cn(
        'backdrop-topo pointer-events-none absolute inset-0 -z-10 h-full w-full',
        !reduced && 'backdrop-topo--draw',
        revealed && 'is-revealed',
        className,
      )}
    >
      <g fill="none" stroke="var(--color-primary)" strokeWidth="1" opacity="0.1">
        {TOPO_PATHS.map((d, i) => (
          <path key={i} d={d} pathLength={100} style={{ ['--i' as string]: i }} />
        ))}
      </g>
    </svg>
  )
}
