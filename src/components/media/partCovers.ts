import type { Part, PartTheme } from '@/data/types'
import { asset } from '@/lib/asset'

export interface Cover {
  src: string
  srcSet: string
  /** Background class for the part's accent bar (decorative, non-text). */
  accent: string
  /** Border class in the same accent, for card edges. */
  edge: string
}

/** Cover photo and accent per catalog theme. Photos: Pixabay, see CREDITS.md. */
export const PART_COVERS: Record<PartTheme, Cover> = {
  ocean: cover('ocean', 'bg-theme-ocean', 'border-theme-ocean'),
  midnight: cover('midnight', 'bg-theme-midnight', 'border-theme-midnight'),
  sunrise: cover('sunrise', 'bg-theme-sunrise', 'border-theme-sunrise'),
  slate: cover('slate', 'bg-theme-slate', 'border-theme-slate'),
  forest: cover('forest', 'bg-theme-forest', 'border-theme-forest'),
  // E12's catalog theme; no part uses it, so it shares the midnight photo.
  aurora: cover('midnight', 'bg-theme-aurora', 'border-theme-aurora'),
}

/** The cover for a part (midnight when the part has no theme). */
export function coverFor(part: Pick<Part, 'theme'> | undefined): Cover {
  return PART_COVERS[part?.theme ?? 'midnight']
}

function cover(name: string, accent: string, edge: string): Cover {
  return {
    src: asset(`/media/part-${name}-1280.webp`),
    srcSet: `${asset(`/media/part-${name}-640.webp`)} 640w, ${asset(`/media/part-${name}-1280.webp`)} 1280w`,
    accent,
    edge,
  }
}

/**
 * Still of the Home hero field (rendered from its own shader at STILL_TIME, see DESIGN.md "Interactive
 * hero"). The hero shows it only without WebGL; pages that are not about one part use it as their band.
 */
export const HERO_POSTER = {
  src: asset('/media/hero-field-1600.webp'),
  srcSet: `${asset('/media/hero-field-1600.webp')} 1600w, ${asset('/media/hero-field-2560.webp')} 2560w`,
}

/** Course-level band image (the hero field still), for pages that are not about one part. */
export const COURSE_COVER = HERO_POSTER
