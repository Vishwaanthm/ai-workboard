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
import { coverFor } from '@/components/media/partCovers'
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
import { cn, plural } from '@/lib/utils'
import { durationLabel, episodeLabel, hasVideo, spokenDurationLabel, watchRatio, watchState } from '@/lib/watch'

export default function LessonPage() {
  const { episodeId } = useParams()
  const { data, progress, setEpisodeComplete } = useAppState()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const episode = parseEpisodeId(data, episodeId)
  if (!episode) return <NotFound />

  const part = getPart(data, episode.partId)
  const cover = coverFor(part)
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
    <>
      {/* Theater: the player sits on an ink stage; everything inside renders in its on-ink form. */}
      <section className="ink-scope on-ink relative isolate overflow-hidden bg-ink">
        <img
          src={cover.src}
          srcSet={cover.srcSet}
          sizes="100vw"
          alt=""
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover opacity-40"
        />
        <div aria-hidden="true" className="band-scrim absolute inset-0 -z-10" />
        <Container className="py-6 md:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-2 text-sm text-on-ink-muted">
                  <li>
                    <Link to="/course" className="link inline-flex min-h-11 items-center">
                      Course
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link to={`/course#part-${episode.partId}`} className="link inline-flex min-h-11 items-center">
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
              <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', cover.accent)} />
              <Badge tone="primary" className="font-mono">
                {episodeLabel(episode.number)}
              </Badge>
              <Badge tone="neutral" className="font-mono">
                <span aria-hidden="true">{durationLabel(episode.durationSec, episode.durationApprox)}</span>
                <span className="sr-only">{spokenDurationLabel(episode.durationSec, episode.durationApprox)}</span>
              </Badge>
              {isOptionalEpisode(data, episode) ? <Badge tone="outline">Optional</Badge> : null}
              {state === 'watched' ? (
                <Badge tone="primary">
                  <CheckCircle2 aria-hidden="true" strokeWidth={1.75} />
                  Watched
                </Badge>
              ) : null}
            </div>
            <PageHeading
              title={episode.title}
              className="mt-3 text-[30px] leading-[1.05] font-extrabold md:text-[44px]"
            />
            <p className="mt-3 max-w-[62ch] text-lg text-on-ink-muted">{episode.summary}</p>

            <div className="mt-6">
              {hasVideo(episode) ? (
                <VideoPlayer key={episode.id} episode={episode} next={next} />
              ) : (
                <VideoPlaceholder title={episode.title} cover={cover} />
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          <article className="min-w-0">
            <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-5 shadow-raised sm:flex-row sm:items-center sm:justify-between">
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
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {lab ? (
                  <Link
                    to={`/labs/${lab.id}`}
                    className="card-lift group flex flex-col gap-2 rounded-panel border border-border bg-card p-5 hover:border-foreground"
                  >
                    <span className="flex items-center gap-2 font-mono text-sm font-semibold text-link">
                      <FlaskConical aria-hidden="true" strokeWidth={1.75} className="size-5" />
                      Lab for this episode
                    </span>
                    <span className="font-display text-lg font-bold">{lab.title}</span>
                    <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      {plural(lab.steps.length, 'step')}
                      <ArrowRight
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="size-4 transition-transform duration-[120ms] group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                ) : null}
                {quiz ? (
                  <Link
                    to={`/quiz/${quiz.id}`}
                    className="card-lift group flex flex-col gap-2 rounded-panel border border-border bg-card p-5 hover:border-foreground"
                  >
                    <span className="flex items-center gap-2 font-mono text-sm font-semibold text-link">
                      <ListChecks aria-hidden="true" strokeWidth={1.75} className="size-5" />
                      {quiz.partId === 'final' ? 'Final assessment' : `End of ${part?.title ?? 'this part'}`}
                    </span>
                    <span className="font-display text-lg font-bold">Take the {quiz.title}</span>
                    <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      {plural(quiz.questions.length, 'question')}
                      <ArrowRight
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="size-4 transition-transform duration-[120ms] group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                ) : null}
              </div>
            ) : null}

            {resources.length > 0 || notes.length > 0 ? (
              <section aria-labelledby="resources-heading" className="mt-12">
                <h2 id="resources-heading" className="text-[26px] leading-[1.1] md:text-[32px]">
                  Resources
                </h2>
                {resources.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-1">
                    {resources.map((r) => (
                      <li key={r.href}>
                        <a
                          href={asset(r.href)}
                          {...(r.kind === 'download' ? { download: '' } : { target: '_blank', rel: 'noreferrer' })}
                          className="link inline-flex min-h-11 items-center gap-2"
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

            <nav aria-label="Episodes" className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
              {previous ? (
                <Link
                  to={`/learn/${previous.id}`}
                  className="group flex min-h-11 items-center gap-3 rounded-panel border border-border bg-card p-4 transition-colors duration-[120ms] hover:border-foreground"
                >
                  <ArrowLeft
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="size-5 shrink-0 transition-transform duration-[120ms] group-hover:-translate-x-1"
                  />
                  <span>
                    <span className="block font-mono text-sm text-muted-foreground">Previous, {episodeLabel(previous.number)}</span>
                    <span className="font-semibold">{previous.title}</span>
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link
                  to={`/learn/${next.id}`}
                  className="group flex min-h-11 items-center justify-end gap-3 rounded-panel border border-border bg-card p-4 text-right transition-colors duration-[120ms] hover:border-foreground"
                >
                  <span>
                    <span className="block font-mono text-sm text-muted-foreground">Next, {episodeLabel(next.number)}</span>
                    <span className="font-semibold">{next.title}</span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="size-5 shrink-0 transition-transform duration-[120ms] group-hover:translate-x-1"
                  />
                </Link>
              ) : null}
            </nav>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-panel border border-border bg-card p-3 shadow-raised">
              <CurriculumNav />
            </div>
          </aside>
        </div>
      </Container>
    </>
  )
}
