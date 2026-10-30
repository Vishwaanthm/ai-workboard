import type { CoverName, Episode, EpisodeTheme } from '@/data/types'
import { asset } from '@/lib/asset'

export interface Image {
  src: string
  srcSet: string
}

export interface Cover extends Image {
  /** Background class for the episode's accent bar (decorative, non-text). */
  accent: string
  /** Border class in the same accent, for card edges. */
  edge: string
}

/** A 640/1280 WebP pair in public/media/. Photos: Pixabay, see CREDITS.md. */
function photo(name: string): Image {
  return {
    src: asset(`/media/${name}-1280.webp`),
    srcSet: `${asset(`/media/${name}-640.webp`)} 640w, ${asset(`/media/${name}-1280.webp`)} 1280w`,
  }
}

/** Episode cover photos, chosen for each episode's part of the restaurant analogy. */
export const COVER_IMAGES: Record<CoverName, Image> = {
  entrance: photo('cover-entrance'),
  typing: photo('cover-typing'),
  plated: photo('cover-plated'),
  lock: photo('cover-lock'),
  code: photo('cover-code'),
}

/** Accent classes per catalog theme (tokens in src/index.css, DESIGN.md "Episode accents"). */
export const THEME_ACCENTS: Record<EpisodeTheme, Pick<Cover, 'accent' | 'edge'>> = {
  glass: { accent: 'bg-theme-glass', edge: 'border-theme-glass' },
  midnight: { accent: 'bg-theme-midnight', edge: 'border-theme-midnight' },
  sunrise: { accent: 'bg-theme-sunrise', edge: 'border-theme-sunrise' },
  slate: { accent: 'bg-theme-slate', edge: 'border-theme-slate' },
  forest: { accent: 'bg-theme-forest', edge: 'border-theme-forest' },
}

/** The cover for an episode: its photo (the entrance when unset) and its theme accent (midnight when unset). */
export function coverFor(episode: Pick<Episode, 'theme' | 'cover'> | undefined): Cover {
  return { ...COVER_IMAGES[episode?.cover ?? 'entrance'], ...THEME_ACCENTS[episode?.theme ?? 'midnight'] }
}

/** Home "Bedrock is a restaurant" section: a working restaurant kitchen. */
export const ANALOGY_IMAGE = photo('analogy-kitchen')

/** Home journey section: plated dishes for the dinner-idea app. */
export const JOURNEY_IMAGE = photo('journey-plates')

/** Labs page band: the code cover. */
export const LABS_COVER: Cover = { ...COVER_IMAGES.code, ...THEME_ACCENTS.forest }

/**
 * Still of the Home hero field (rendered from its own shader at STILL_TIME, see DESIGN.md "Interactive
 * hero"). The hero shows it only without WebGL; pages that are not about one episode use it as their band.
 */
export const HERO_POSTER: Image = {
  src: asset('/media/hero-field-1600.webp'),
  srcSet: `${asset('/media/hero-field-1600.webp')} 1600w, ${asset('/media/hero-field-2560.webp')} 2560w`,
}

/** Course-level band image (the hero field still), for pages that are not about one episode. */
export const COURSE_COVER = HERO_POSTER
