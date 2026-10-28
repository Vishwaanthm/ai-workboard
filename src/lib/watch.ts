/** Pure watch-progress rules for video episodes. Nothing here touches storage or React. */
import type { CourseData, Episode, Lang } from '@/data/types'
import type { Progress, WatchRecord } from './schema'

/** An episode counts as watched once 90% of it has been played. */
export const WATCHED_RATIO = 0.9
/** Resume only when the saved position is past the first few seconds and before the end. */
export const RESUME_MIN_SEC = 5

export const LANG_LABELS: Record<Lang, { label: string; native: string }> = {
  en: { label: 'English', native: 'English' },
  es: { label: 'Spanish', native: 'Español' },
  hi: { label: 'Hindi', native: 'हिन्दी' },
  ta: { label: 'Tamil', native: 'தமிழ்' },
}
export const LANG_ORDER: Lang[] = ['en', 'es', 'hi', 'ta']

/** E01, E02, ... */
export function episodeLabel(n: number): string {
  return `E${String(n).padStart(2, '0')}`
}

/** m:ss for any length (92 minutes is "92:00"). */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Spoken form for screen readers, for example "7 minutes 30 seconds". */
export function spokenDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  const parts = [m > 0 ? `${m} minute${m === 1 ? '' : 's'}` : '', s > 0 ? `${s} second${s === 1 ? '' : 's'}` : '']
  return parts.filter(Boolean).join(' ') || '0 seconds'
}

/** "7:21" for a measured length, "≈ 8 min" while the length is a catalog target. */
export function durationLabel(totalSec: number, approx?: boolean): string {
  return approx ? `≈ ${Math.max(1, Math.round(totalSec / 60))} min` : formatDuration(totalSec)
}

/** Spoken form of durationLabel, for screen readers. */
export function spokenDurationLabel(totalSec: number, approx?: boolean): string {
  return approx ? `about ${Math.max(1, Math.round(totalSec / 60))} minutes` : spokenDuration(totalSec)
}

/** Label for a set of episodes: approximate when any of them has no measured length yet. */
export function totalDurationLabel(episodes: Episode[]): string {
  const total = episodes.reduce((sum, e) => sum + e.durationSec, 0)
  return durationLabel(total, episodes.some((e) => e.durationApprox))
}

export function partDuration(data: CourseData, partId: number): number {
  return data.episodes.filter((e) => e.partId === partId).reduce((sum, e) => sum + e.durationSec, 0)
}

export function courseDuration(data: CourseData): number {
  return data.episodes.reduce((sum, e) => sum + e.durationSec, 0)
}

export function availableLangs(episode: Episode): Lang[] {
  return LANG_ORDER.filter((l) => Boolean(episode.videos[l]))
}

export function hasVideo(episode: Episode): boolean {
  return availableLangs(episode).length > 0
}

/** Length to measure against: the real file length once known, else the catalogue duration. */
export function effectiveDuration(episode: Episode, record?: WatchRecord): number {
  return record && record.durationSec > 0 ? record.durationSec : episode.durationSec
}

export function watchRatio(p: Progress, episode: Episode): number {
  const record = p.watch[String(episode.id)]
  if (!record) return 0
  const total = effectiveDuration(episode, record)
  return total > 0 ? Math.min(record.maxSec / total, 1) : 0
}

export type WatchState = 'not-started' | 'partly' | 'watched'

export function watchState(p: Progress, episode: Episode): WatchState {
  if (p.completedEpisodes.includes(episode.id) || watchRatio(p, episode) >= WATCHED_RATIO) return 'watched'
  return p.watch[String(episode.id)] ? 'partly' : 'not-started'
}

/** Merges a new player sample into the stored record (max watched only grows). */
export function recordWatch(
  p: Progress,
  episodeId: number,
  sample: { positionSec: number; durationSec: number; at: string },
): Progress {
  const key = String(episodeId)
  const previous = p.watch[key]
  const duration = sample.durationSec > 0 ? sample.durationSec : (previous?.durationSec ?? 0)
  const position = Math.max(0, duration > 0 ? Math.min(sample.positionSec, duration) : sample.positionSec)
  const record: WatchRecord = {
    positionSec: Math.round(position * 10) / 10,
    maxSec: Math.round(Math.max(previous?.maxSec ?? 0, position) * 10) / 10,
    durationSec: Math.round(duration * 10) / 10,
    updatedAt: sample.at,
  }
  return { ...p, watch: { ...p.watch, [key]: record } }
}

/** Position to resume from, or 0 when the episode should start from the beginning. */
export function resumePosition(p: Progress, episode: Episode): number {
  const record = p.watch[String(episode.id)]
  if (!record) return 0
  const total = effectiveDuration(episode, record)
  if (record.positionSec < RESUME_MIN_SEC) return 0
  if (total > 0 && record.positionSec > total - RESUME_MIN_SEC) return 0
  return record.positionSec
}

/** The most recently watched episode that is started but not finished. */
export function continueWatching(p: Progress, data: CourseData): { episode: Episode; record: WatchRecord } | null {
  let best: { episode: Episode; record: WatchRecord } | null = null
  for (const episode of data.episodes) {
    const record = p.watch[String(episode.id)]
    if (!record || watchState(p, episode) !== 'partly' || resumePosition(p, episode) === 0) continue
    if (!best || record.updatedAt > best.record.updatedAt) best = { episode, record }
  }
  return best
}
