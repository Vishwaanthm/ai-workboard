import { CheckCircle2, Circle, CircleDashed } from 'lucide-react'
import { NavLink } from 'react-router'
import { episodesInPart } from '@/data'
import { useAppState } from '@/context/useAppState'
import { cn } from '@/lib/utils'
import { durationLabel, episodeLabel, totalDurationLabel, watchRatio, watchState } from '@/lib/watch'

/** Parts and their episodes with watch state. Used in the lesson sidebar and its mobile drawer. */
export function CurriculumNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data, progress } = useAppState()
  return (
    <nav aria-label="Course contents">
      <ol className="flex flex-col gap-5">
        {data.parts.map((part) => (
          <li key={part.id}>
            <p className="flex items-baseline justify-between gap-2 px-2 font-mono text-sm font-semibold text-muted-foreground">
              <span>
                {part.title}
                {part.optional ? ' (optional)' : ''}
              </span>
              <span className="font-sans font-medium">{totalDurationLabel(episodesInPart(data, part.id))}</span>
            </p>
            <ol className="mt-1 flex flex-col">
              {episodesInPart(data, part.id).map((e) => {
                const state = watchState(progress, e)
                return (
                  <li key={e.id}>
                    <NavLink
                      to={`/learn/${e.id}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-11 items-center gap-2 rounded-control px-2 py-2 text-[15px] transition-colors duration-[120ms]',
                          isActive ? 'bg-primary-soft font-semibold text-foreground' : 'hover:bg-primary-soft/60',
                        )
                      }
                    >
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
          </li>
        ))}
      </ol>
    </nav>
  )
}
