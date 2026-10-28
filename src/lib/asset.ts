/**
 * Resolve a root-relative public path (e.g. "/media/hero.mp4") against the deploy base path, so the
 * site works both at "/" (dev) and under a sub-path such as "/ai-workboard/" (GitHub Pages).
 * Absolute URLs and relative paths are returned unchanged.
 */
export function asset(path: string): string
export function asset(path: string | undefined): string | undefined
export function asset(path: string | undefined): string | undefined {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}
