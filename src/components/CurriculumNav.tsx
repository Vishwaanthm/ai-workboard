import { CheckCircle2, Circle, CircleDashed } from 'lucide-react'
import { NavLink } from 'react-router'
import { coverFor } from '@/components/media/covers'
import { useAppState } from '@/context/useAppState'
import { cn } from '@/lib/utils'
import { durationLabel, episodeLabel, totalDurationLabel, watchRatio, watchState } from '@/lib/watch'

/** Every episode with its accent, watch state and length. Used in the lesson sidebar and its mobile drawer. */
export function CurriculumNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data, progress } = useAppState()
  return (
    <nav aria-label="Course contents">
      <p className="flex items-baseline justify-between gap-2 px-2 font-mono text-sm font-semibold text-muted-foreground">
        <span>Episodes</span>
        <span className="font-sans font-medium">{totalDurationLabel(data.episodes)}</span>
      </p>
      <ol className="mt-1 flex flex-col">
        {data.episodes.map((e) => {
          const state = watchState(progress, e)
          return (
            <li key={e.id}>
              <NavLink
                to={`/learn/${e.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-11 items-center gap-2 rounded-control py-2 pr-2 pl-3 text-[15px] transition-colors duration-[120ms]',
                    isActive ? 'bg-primary-soft font-semibold text-foreground' : 'hover:bg-primary-soft/60',
                  )
                }
              >
                <span aria-hidden="true" className={cn('absolute inset-y-2 left-0 w-1 rounded-full', coverFor(e).accent)} />
                {state === 'watched' ? (
                  <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-progress" />
                ) : state === 'partly' ? (
                  <CircleDashed aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-progress" />
                ) : (
                  <Circle aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-input" />
                )}
                <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">{episodeLabel(e.number)}</span>
                <span className="min-w-0 flex-1">
                  {e.title}
                  {state === 'watched' ? <span className="sr-only"> (watched)</span> : null}
                  {state === 'partly' ? (
                    <span className="sr-only"> ({Math.round(watchRatio(progress, e) * 100)}% watched)</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{durationLabel(e.durationSec, e.durationApprox)}</span>
              </NavLink>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
