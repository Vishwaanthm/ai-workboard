import type { PartMotifName } from '@/data/types'
import { cn } from '@/lib/utils'

/**
 * Small original line illustrations, one per course part. Decorative only (aria-hidden); colors come
 * from DESIGN.md tokens. Static, so they need no reduced-motion handling.
 */
const PATHS: Record<PartMotifName, string[]> = {
  // Foundations: a console window with a sidebar menu
  console: ['M6 8h36v32H6z', 'M6 15h36', 'M15 15v25', 'M20 21h16', 'M20 27h12', 'M20 33h14', 'M9 11.5h1M12 11.5h1'],
  // Text models: a chat bubble with token blocks
  text: ['M8 10h32v20H22l-8 7v-7H8z', 'M13 16h6v4h-6z', 'M21 16h8v4h-8z', 'M31 16h4v4h-4z', 'M13 23h10'],
  // Images and video: a frame with a mountain and a film strip
  media: ['M6 9h28v22H6z', 'M6 27l9-9 7 7 4-4 8 8', 'M27 15.5a2.5 2.5 0 1 0 0.01 0', 'M38 17h4v22H16v-4', 'M38 22h4M38 28h4M38 34h4'],
  // Safety: a shield with a check
  shield: ['M24 6l15 6v10c0 9.5-6.5 16.5-15 20-8.5-3.5-15-10.5-15-20V12z', 'M17 24l5 5 9-10'],
  // Building: code brackets and a slash
  code: ['M17 14l-9 10 9 10', 'M31 14l9 10-9 10', 'M27 10l-6 28'],
  // Beyond the basics: a compass
  explore: ['M24 6a18 18 0 1 0 0.01 0', 'M30 18l-4 8-8 4 4-8z', 'M24 9v3M24 36v3M9 24h3M36 24h3'],
}

const ORDER: PartMotifName[] = ['console', 'text', 'media', 'shield', 'code', 'explore']

/** `motif` from the part data wins; otherwise the motif follows the part's position in the course. */
export function PartMotif({
  motif,
  index = 0,
  className,
}: {
  motif?: PartMotifName
  index?: number
  className?: string
}) {
  const name = motif ?? ORDER[index % ORDER.length] ?? 'console'
  const paths = PATHS[name]
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      data-motif={name}
      className={cn('pointer-events-none size-10 shrink-0', className)}
      fill="none"
      stroke="var(--color-primary)"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

export const PART_MOTIFS = ORDER
