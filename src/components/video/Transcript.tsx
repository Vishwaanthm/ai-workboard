import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { Lang } from '@/data/types'
import { formatDuration } from '@/lib/watch'
import { parseVtt, type Cue } from '@/lib/vtt'
import { cn } from '@/lib/utils'

/** Collapsible transcript built from the episode's WebVTT file; loads only when first opened. */
export function Transcript({ src, lang, onSeek }: { src: string; lang: Lang; onSeek: (t: number) => void }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'ready' | 'error'; cues: Cue[] }>({
    status: 'idle',
    cues: [],
  })
  const panelId = useId()

  useEffect(() => {
    if (!open || state.status !== 'idle') return
    let cancelled = false
    setState({ status: 'loading', cues: [] })
    fetch(src)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => {
        if (!cancelled) setState({ status: 'ready', cues: parseVtt(text) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', cues: [] })
      })
    return () => {
      cancelled = true
    }
  }, [open, src, state.status])

  return (
    <section className="rounded-panel border border-border bg-card">
      <h2 className="text-[22px]">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 px-4 text-left font-mono"
        >
          Transcript
          <ChevronDown
            aria-hidden="true"
            strokeWidth={1.75}
            className={cn('size-5 transition-transform duration-[200ms] ease-out', open && 'rotate-180')}
          />
        </button>
      </h2>
      <div id={panelId} hidden={!open} className="border-t border-border px-4 py-3" lang={lang}>
        {state.status === 'loading' ? <p role="status">Loading transcript.</p> : null}
        {state.status === 'error' ? <p role="alert">The transcript could not be loaded.</p> : null}
        {state.status === 'ready' && state.cues.length === 0 ? <p>This transcript is empty.</p> : null}
        {state.status === 'ready' && state.cues.length > 0 ? (
          <ol className="flex max-h-96 flex-col overflow-y-auto">
            {state.cues.map((cue) => (
              <li key={`${cue.start}-${cue.text.slice(0, 12)}`}>
                <button
                  type="button"
                  onClick={() => onSeek(cue.start)}
                  className="flex min-h-11 w-full cursor-pointer gap-3 rounded-control px-2 py-1.5 text-left hover:bg-primary-soft"
                >
                  <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground" lang="en">
                    {formatDuration(cue.start)}
                  </span>
                  <span>{cue.text}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  )
}
