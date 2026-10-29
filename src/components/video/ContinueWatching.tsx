import { PlayCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Progress } from '@/components/ui/progress'
import { useAppState } from '@/context/useAppState'
import { cn } from '@/lib/utils'
import { continueWatching, effectiveDuration, episodeLabel, formatDuration } from '@/lib/watch'

/** "Continue watching" card for the most recent partly watched episode; renders nothing otherwise. */
export function ContinueWatching({ className }: { className?: string }) {
  const { data, progress } = useAppState()
  const item = continueWatching(progress, data)
  if (!item) return null
  const { episode, record } = item
  const total = effectiveDuration(episode, record)
  return (
    <Link
      to={`/learn/${episode.id}`}
      className={cn(
        'flex flex-col gap-3 rounded-panel border border-progress bg-primary-soft p-4 transition-colors duration-[120ms] hover:border-foreground',
        className,
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-primary-hover">
        <PlayCircle aria-hidden="true" strokeWidth={1.75} className="size-5" />
        Continue watching
      </span>
      <span className="font-semibold">
        <span className="font-mono text-sm text-muted-foreground">{episodeLabel(episode.number)}</span> {episode.title}
      </span>
      <span className="text-sm text-muted-foreground">
        {formatDuration(record.positionSec)} of {formatDuration(total)}
      </span>
      <Progress value={Math.round(record.positionSec)} max={Math.round(total)} label={`Episode ${episode.number} position`} />
    </Link>
  )
}
