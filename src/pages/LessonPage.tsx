import { asset } from '@/lib/asset'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FlaskConical,
  ListChecks,
  PanelLeft,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { CurriculumNav } from '@/components/CurriculumNav'
import { Container, NotFound, VideoPlaceholder } from '@/components/misc'
import { NoteBlocks } from '@/components/NoteBlocks'
import { PageHeading } from '@/components/PageHeading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { firstLesson, getLab, getPart, getQuiz, isOptionalEpisode, parseEpisodeId, quizForPart } from '@/data'
import { useAppState } from '@/context/useAppState'
import { episodeNeighbours, isEpisodeComplete, isLastInPart } from '@/lib/progress'
import { plural } from '@/lib/utils'
import { episodeLabel, formatDuration, hasVideo, spokenDuration, watchRatio, watchState } from '@/lib/watch'

export default function LessonPage() {
  const { episodeId } = useParams()
  const { data, progress, setEpisodeComplete } = useAppState()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const episode = parseEpisodeId(data, episodeId)
  if (!episode) return <NotFound />

  const part = getPart(data, episode.partId)
  const lab = episode.labId ? getLab(data, episode.labId) : undefined
  const quiz = episode.quizAfter
    ? getQuiz(data, episode.quizAfter)
    : isLastInPart(data, episode.id)
      ? quizForPart(data, episode.partId)
      : undefined
  const { previous, next } = episodeNeighbours(data, episode.id)
  const done = isEpisodeComplete(progress, episode.id)
  const state = watchState(progress, episode)
  const ratio = watchRatio(progress, episode)
  const resources = episode.resources ?? []
  const notes = episode.notes ?? []

  const toggleComplete = () => {
    setEpisodeComplete(episode.id, !done)
    toast.success(done ? `"${episode.title}" marked as not complete` : `"${episode.title}" marked complete`)
  }

  return (
    <Container className="py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
            <CurriculumNav />
          </div>
        </aside>

        <article className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <li>
                  <Link to="/course" className="inline-flex min-h-11 items-center hover:text-primary">
                    Course
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    to={`/course#part-${episode.partId}`}
                    className="inline-flex min-h-11 items-center hover:text-primary"
                  >
                    {part?.title ?? 'Part'}
                  </Link>
                </li>
              </ol>
            </nav>
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary" className="lg:hidden">
                  <PanelLeft aria-hidden="true" strokeWidth={1.75} />
                  Episodes
                </Button>
              </SheetTrigger>
              <SheetContent title="Episodes" description="All episodes with your progress">
                <CurriculumNav onNavigate={() => setDrawerOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary" className="font-mono">
              {episodeLabel(episode.number)}
            </Badge>
            <Badge tone="neutral">
              <span aria-hidden="true">{formatDuration(episode.durationSec)}</span>
              <span className="sr-only">{spokenDuration(episode.durationSec)}</span>
            </Badge>
            {isOptionalEpisode(data, episode) ? <Badge tone="outline">Optional</Badge> : null}
            {state === 'watched' ? (
              <Badge tone="primary">
                <CheckCircle2 aria-hidden="true" strokeWidth={1.75} />
                Watched
              </Badge>
            ) : null}
          </div>
          <PageHeading title={episode.title} className="mt-2" />
          <p className="mt-3 max-w-[62ch] text-lg text-muted-foreground">{episode.summary}</p>

          <div className="mt-6">
            {hasVideo(episode) ? (
              <VideoPlayer key={episode.id} episode={episode} next={next} />
            ) : (
              <VideoPlaceholder title={episode.title} />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <p className="text-sm text-muted-foreground">
                {state === 'watched'
                  ? 'Watched'
                  : state === 'partly'
                    ? `${Math.round(ratio * 100)}% watched`
                    : 'Not started'}
              </p>
              <Progress
                value={Math.round(ratio * 100)}
                max={100}
                label={`Episode ${episode.number} watched`}
                className="mt-2"
              />
            </div>
            <Button variant={done ? 'secondary' : 'primary'} size="lg" onClick={toggleComplete}>
              {done ? (
                <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="text-progress" />
              ) : (
                <Check aria-hidden="true" strokeWidth={1.75} />
              )}
              {done ? 'Completed (undo)' : 'Mark complete'}
            </Button>
          </div>

          {data.course.notice && firstLesson(data)?.id === episode.id ? (
            <Callout tone="info" title="Good to know" className="mt-8">
              <p>{data.course.notice}</p>
            </Callout>
          ) : null}

          {lab || quiz ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {lab ? (
                <Link
                  to={`/labs/${lab.id}`}
                  className="flex flex-col gap-2 rounded-panel border border-border bg-card p-5 transition-colors duration-[120ms] hover:border-primary"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-primary">
                    <FlaskConical aria-hidden="true" strokeWidth={1.75} className="size-5" />
                    Lab for this episode
                  </span>
                  <span className="font-semibold">{lab.title}</span>
                  <span className="text-sm text-muted-foreground">{plural(lab.steps.length, 'step')}</span>
                </Link>
              ) : null}
              {quiz ? (
                <Link
                  to={`/quiz/${quiz.id}`}
                  className="flex flex-col gap-2 rounded-panel border border-border bg-card p-5 transition-colors duration-[120ms] hover:border-primary"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-primary">
                    <ListChecks aria-hidden="true" strokeWidth={1.75} className="size-5" />
                    {quiz.partId === 'final' ? 'Final assessment' : `End of ${part?.title ?? 'this part'}`}
                  </span>
                  <span className="font-semibold">Take the {quiz.title}</span>
                  <span className="text-sm text-muted-foreground">{plural(quiz.questions.length, 'question')}</span>
                </Link>
              ) : null}
            </div>
          ) : null}

          {resources.length > 0 || notes.length > 0 ? (
            <section aria-labelledby="resources-heading" className="mt-10">
              <h2 id="resources-heading" className="text-[22px] md:text-[28px]">
                Resources
              </h2>
              {resources.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {resources.map((r) => (
                    <li key={r.href}>
                      <a
                        href={asset(r.href)}
                        {...(r.kind === 'download' ? { download: '' } : { target: '_blank', rel: 'noreferrer' })}
                        className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {r.kind === 'download' ? (
                          <Download aria-hidden="true" strokeWidth={1.75} className="size-5" />
                        ) : (
                          <ExternalLink aria-hidden="true" strokeWidth={1.75} className="size-5" />
                        )}
                        {r.label}
                        {r.kind === 'link' ? <span className="sr-only"> (opens in a new tab)</span> : null}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {notes.length > 0 ? (
                <div className="mt-6">
                  <NoteBlocks blocks={notes} />
                </div>
              ) : null}
            </section>
          ) : null}

          <nav
            aria-label="Episodes"
            className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between"
          >
            {previous ? (
              <Button variant="ghost" asChild className="justify-start whitespace-normal text-left">
                <Link to={`/learn/${previous.id}`}>
                  <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
                  <span>
                    <span className="block text-sm text-muted-foreground">Previous, {episodeLabel(previous.number)}</span>
                    {previous.title}
                  </span>
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button variant="ghost" asChild className="justify-end whitespace-normal text-right">
                <Link to={`/learn/${next.id}`}>
                  <span>
                    <span className="block text-sm text-muted-foreground">Next, {episodeLabel(next.number)}</span>
                    {next.title}
                  </span>
                  <ArrowRight aria-hidden="true" strokeWidth={1.75} />
                </Link>
              </Button>
            ) : null}
          </nav>
        </article>
      </div>
    </Container>
  )
}
