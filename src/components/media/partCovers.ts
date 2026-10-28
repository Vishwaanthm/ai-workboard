import type { PartTheme } from '@/data/types'
import { asset } from '@/lib/asset'

/** Cover photo and accent class per catalog theme. Photos: Pixabay, see CREDITS.md. */
export const PART_COVERS: Record<PartTheme, { src: string; srcSet: string; accent: string }> = {
  ocean: cover('ocean', 'bg-theme-ocean'),
  midnight: cover('midnight', 'bg-theme-midnight'),
  sunrise: cover('sunrise', 'bg-theme-sunrise'),
  slate: cover('slate', 'bg-theme-slate'),
  forest: cover('slate', 'bg-theme-forest'),
  aurora: cover('midnight', 'bg-theme-aurora'),
}

function cover(name: string, accent: string) {
  return {
    src: asset(`/media/part-${name}-1280.webp`),
    srcSet: `${asset(`/media/part-${name}-640.webp`)} 640w, ${asset(`/media/part-${name}-1280.webp`)} 1280w`,
    accent,
  }
}

/** Hero background loop (Pixabay, see CREDITS.md). Only the poster is preloaded (index.html). */
export const HERO_MEDIA = {
  mp4: asset('/media/hero.mp4'),
  poster: asset('/media/hero-poster.webp'),
}
