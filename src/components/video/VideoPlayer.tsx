import { asset } from '@/lib/asset'
import { Captions, Play, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/context/useAppState'
import type { Episode, Lang } from '@/data/types'
import { usePrefersReducedMotion } from '@/lib/motion'
import { isEpisodeComplete } from '@/lib/progress'
import { readJSON, storageKeys, writeJSON } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { availableLangs, formatDuration, LANG_LABELS, resumePosition, WATCHED_RATIO } from '@/lib/watch'
import { Transcript } from './Transcript'

export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const
const SAVE_EVERY_MS = 5000
export const UP_NEXT_SECONDS = 5

interface Prefs {
  lang?: Lang
  rate?: number
}

function readPrefs(): Prefs {
  return readJSON<Prefs>(storageKeys.prefs, {}, (v) => {
    if (typeof v !== 'object' || v === null) return null
    const { lang, rate } = v as Record<string, unknown>
    return {
      lang: typeof lang === 'string' && lang in LANG_LABELS ? (lang as Lang) : undefined,
      rate: typeof rate === 'number' && (SPEEDS as readonly number[]).includes(rate) ? rate : undefined,
    }
  })
}

/**
 * Video-first lesson player built on the native <video> element (keyboard accessible controls).
 * Language switch keeps position and play state; captions start on when a track exists; playback speed;
 * chapters; resume; auto-complete at 90%; "Up next" with a cancellable countdown (no countdown under
 * reduced motion); transcript from the VTT file.
 */
export function VideoPlayer({ episode, next }: { episode: Episode; next?: Episode }) {
  const { progress, recordWatch, setEpisodeComplete } = useAppState()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reduced = usePrefersReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const langs = availableLangs(episode)
  const prefs = useRef(readPrefs())
  const [lang, setLang] = useState<Lang>(() =>
    prefs.current.lang && langs.includes(prefs.current.lang) ? prefs.current.lang : (langs[0] ?? 'en'),
  )
  const [rate, setRate] = useState<number>(prefs.current.rate ?? 1)
  const [captionsOn, setCaptionsOn] = useState(true)
  const [duration, setDuration] = useState(episode.durationSec)
  const [chapterIndex, setChapterIndex] = useState(-1)
  const [resumedAt, setResumedAt] = useState<number | null>(null)
  const [upNext, setUpNext] = useState<'off' | 'counting' | 'waiting'>('off')
  const [countdown, setCountdown] = useState(UP_NEXT_SECONDS)

  const ids = { lang: useId(), speed: useId(), chapters: useId() }
  const pendingSwitch = useRef<{ time: number; playing: boolean } | null>(null)
  const resumeHandled = useRef(false)
  const lastSaved = useRef(0)
  const completedRef = useRef(isEpisodeComplete(progress, episode.id))
  const latest = useRef({ time: 0, duration: episode.durationSec })

  const captionLang: Lang | undefined = episode.captions[lang] ? lang : langs.find((l) => episode.captions[l])
  const chapters = episode.chapters ?? []

  const save = useCallback(() => {
    const { time, duration: d } = latest.current
    if (time > 0) recordWatch(episode.id, time, d)
    lastSaved.current = Date.now()
  }, [episode.id, recordWatch])

  // Save on page hide and when leaving the episode. The listener is attached once; it calls the latest
  // save through a ref, so a new callback identity never triggers an extra save.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveRef.current()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      saveRef.current()
    }
  }, [])

  // Show the caption track for the chosen language (or hide all tracks).
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    for (const track of Array.from(video.textTracks)) {
      track.mode = captionsOn && track.language === captionLang ? 'showing' : 'disabled'
    }
  }, [captionLang, captionsOn, lang])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
    video.defaultPlaybackRate = rate
  }, [rate])

  // Up-next countdown (never runs under reduced motion).
  useEffect(() => {
    if (upNext !== 'counting' || !next) return
    if (countdown <= 0) {
      navigate(`/learn/${next.id}?autoplay=1`)
      return
    }
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [upNext, countdown, next, navigate])

  const onLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration)
      latest.current.duration = video.duration
    }
    video.playbackRate = rate
    const pending = pendingSwitch.current
    if (pending) {
      pendingSwitch.current = null
      video.currentTime = pending.time
      if (pending.playing) void video.play().catch(() => undefined)
      return
    }
    if (!resumeHandled.current) {
      resumeHandled.current = true
      const at = resumePosition(progress, episode)
      if (at > 0) {
        video.currentTime = at
        setResumedAt(at)
      }
      if (params.get('autoplay') === '1') void video.play().catch(() => undefined)
    }
  }

  const onTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const d = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration
    latest.current = { time: video.currentTime, duration: d }
    if (Date.now() - lastSaved.current >= SAVE_EVERY_MS) save()
    if (!completedRef.current && d > 0 && video.currentTime / d >= WATCHED_RATIO) {
      completedRef.current = true
      setEpisodeComplete(episode.id, true)
      toast.success(`Episode ${episode.number} marked complete`)
    }
    let idx = -1
    chapters.forEach((c, i) => {
      if (video.currentTime >= c.t) idx = i
    })
    if (idx !== chapterIndex) setChapterIndex(idx)
  }

  const onEnded = () => {
    save()
    if (!next) return
    setCountdown(UP_NEXT_SECONDS)
    setUpNext(reduced ? 'waiting' : 'counting')
  }

  const switchLang = (value: Lang) => {
    const video = videoRef.current
    if (video) pendingSwitch.current = { time: video.currentTime, playing: !video.paused }
    setLang(value)
    writeJSON(storageKeys.prefs, { ...readPrefs(), lang: value })
  }

  const changeRate = (value: number) => {
    setRate(value)
    writeJSON(storageKeys.prefs, { ...readPrefs(), rate: value })
  }

  const seek = (t: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = t
    video.focus()
  }

  const startOver = () => {
    seek(0)
    setResumedAt(null)
  }

  const src = episode.videos[lang]
  // Cross-origin caption tracks need CORS mode; same-origin files must not be forced into it.
  const external = [src, ...Object.values(episode.captions)].some(
    (u) => typeof u === 'string' && /^https?:\/\//.test(u) && !u.startsWith(window.location.origin),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-panel bg-code">
        {/* Caption <track> elements are rendered from the episode data below; docs/ADDING-VIDEOS.md requires a VTT per language. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          key={episode.id}
          src={asset(src)}
          poster={asset(episode.poster)}
          controls
          preload="metadata"
          playsInline
          crossOrigin={external ? 'anonymous' : undefined}
          className="aspect-video w-full bg-code"
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onPause={save}
          onEnded={onEnded}
          data-testid="episode-video"
          aria-label={`Episode ${episode.number}: ${episode.title}`}
        >
          {langs
            .filter((l) => episode.captions[l])
            .map((l) => (
              <track
                key={l}
                kind="captions"
                src={asset(episode.captions[l])}
                srcLang={l}
                label={LANG_LABELS[l].native}
                default={l === captionLang}
              />
            ))}
        </video>

        {upNext !== 'off' && next ? (
          <section
            aria-labelledby="up-next-title"
            className="absolute inset-x-3 bottom-3 rounded-panel bg-card p-4 text-foreground shadow-raised sm:inset-x-auto sm:right-4 sm:w-80"
            data-testid="up-next"
          >
            <p id="up-next-title" className="text-sm font-medium text-muted-foreground">
              Up next: Episode {next.number}
            </p>
            <p className="mt-1 font-semibold">{next.title}</p>
            {upNext === 'counting' ? (
              <p className="mt-1 text-sm text-muted-foreground">
                <span aria-hidden="true">Starts in {countdown} s</span>
                <span className="sr-only" role="status">
                  Next episode starts in {UP_NEXT_SECONDS} seconds unless you cancel.
                </span>
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`/learn/${next.id}?autoplay=1`}>
                  <Play aria-hidden="true" strokeWidth={1.75} />
                  Play next
                </Link>
              </Button>
              <Button variant="secondary" onClick={() => setUpNext('off')}>
                <X aria-hidden="true" strokeWidth={1.75} />
                {upNext === 'counting' ? 'Cancel' : 'Stay here'}
              </Button>
            </div>
          </section>
        ) : null}
      </div>

      {chapters.length > 0 && duration > 0 ? (
        <div aria-hidden="true" className="relative h-1.5 rounded-control bg-muted" data-testid="chapter-markers">
          {chapters.map((c) => (
            <span
              key={c.t}
              className="absolute top-0 h-full w-0.5 bg-primary"
              style={{ left: `${Math.min((c.t / duration) * 100, 100)}%` }}
            />
          ))}
        </div>
      ) : null}

      {resumedAt !== null ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" role="status">
          Resumed at {formatDuration(resumedAt)}.
          <Button variant="link" onClick={startOver} className="min-h-11">
            <RotateCcw aria-hidden="true" strokeWidth={1.75} />
            Start over
          </Button>
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        {langs.length > 1 ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.lang} className="text-sm font-medium">
              Language
            </label>
            <select
              id={ids.lang}
              value={lang}
              onChange={(e) => switchLang(e.target.value as Lang)}
              className="min-h-11 rounded-control border border-input bg-card px-3"
            >
              {langs.map((l) => (
                <option key={l} value={l} lang={l}>
                  {LANG_LABELS[l].native}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.speed} className="text-sm font-medium">
            Speed
          </label>
          <select
            id={ids.speed}
            value={rate}
            onChange={(e) => changeRate(Number(e.target.value))}
            className="min-h-11 rounded-control border border-input bg-card px-3"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
        {captionLang ? (
          <Button variant="secondary" aria-pressed={captionsOn} onClick={() => setCaptionsOn((v) => !v)}>
            <Captions aria-hidden="true" strokeWidth={1.75} />
            Captions
          </Button>
        ) : null}
      </div>

      {chapters.length > 0 ? (
        <section aria-labelledby={ids.chapters}>
          <h2 id={ids.chapters} className="text-[22px]">
            Chapters
          </h2>
          <ol className="mt-3 flex flex-col">
            {chapters.map((c, i) => (
              <li key={c.t}>
                <button
                  type="button"
                  onClick={() => seek(c.t)}
                  aria-current={i === chapterIndex ? 'true' : undefined}
                  className={cn(
                    'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-2 text-left transition-colors duration-[120ms] hover:bg-primary-soft',
                    i === chapterIndex && 'bg-primary-soft font-semibold',
                  )}
                >
                  <span className="w-14 shrink-0 font-mono text-sm text-muted-foreground">{formatDuration(c.t)}</span>
                  <span>{c.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {captionLang && episode.captions[captionLang] ? (
        <Transcript key={captionLang} src={asset(episode.captions[captionLang]!)} lang={captionLang} onSeek={seek} />
      ) : null}
    </div>
  )
}
