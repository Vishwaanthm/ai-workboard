import { ArrowRight, CheckCircle2, CircleDashed, FlaskConical } from 'lucide-react'
import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ProgressRing } from '@/components/art/ProgressRing'
import { COURSE_COVER, coverFor } from '@/components/media/covers'
import { Container } from '@/components/misc'
import { Reveal } from '@/components/motion/Reveal'
import { PageBand } from '@/components/PageBand'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Progress } from '@/components/ui/progress'
import { ContinueWatching } from '@/components/video/ContinueWatching'
import { courseCounts, firstLesson, isOptionalEpisode } from '@/data'
import { site } from '@/data/site'
import { useAppState } from '@/context/useAppState'
import {
  coreProgress,
  hasAnyProgress,
  nextStep,
  nextStepHref,
  visibleCertificate,
} from '@/lib/progress'
import { cn, plural } from '@/lib/utils'
import {
  courseDuration,
  durationLabel,
  episodeLabel,
  formatDuration,
  spokenDurationLabel,
  timedChapters,
  totalDurationLabel,
  watchRatio,
  watchState,
} from '@/lib/watch'

function EnrolCard() {
  const { data, user, progress } = useAppState()
  const counts = courseCounts(data)
  const included = [
    `${plural(counts.episodes, 'video episode')}, ${totalDurationLabel(data.episodes)} in total`,
    plural(counts.labs, 'guided lab'),
    `${plural(counts.episodeQuizzes, 'episode quiz', 'episode quizzes')}${counts.hasFinal ? ' and a final assessment' : ''}`,
    'A printable certificate of completion',
  ]

  let action: { label: string; to: string }
  let secondary: { label: string; to: string } | null = null
  if (!user) {
    action = { label: 'Create account', to: '/register' }
    secondary = { label: 'Log in', to: '/login' }
  } else if (visibleCertificate(progress, data)) {
    action = { label: 'View certificate', to: '/certificate' }
  } else {
    const step = nextStep(progress, data)
    const first = firstLesson(data)
    if (!hasAnyProgress(progress) && first) action = { label: `Start ${first.title}`, to: `/learn/${first.id}` }
    else if (step.kind === 'episode') action = { label: `Continue: ${step.episode.title}`, to: nextStepHref(step) }
    else action = { label: 'Continue the course', to: nextStepHref(step) }
  }
  const { done, total } = coreProgress(progress, data)
  const headingId = useId()

  return (
    <aside
      aria-labelledby={headingId}
      className="relative overflow-hidden rounded-panel border border-border bg-card p-6 shadow-lift"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-volt" />
      <h2 id={headingId} className="text-[24px]">
        {user ? 'Your progress' : 'Start learning'}
      </h2>
      {user ? (
        <div className="mt-4 flex items-center gap-4">
          <ProgressRing value={done} max={total} label="Required episodes complete" />
          <p className="text-sm text-muted-foreground">
            {done} of {total} required episodes complete
          </p>
        </div>
      ) : null}
      {user ? <ContinueWatching className="mt-4" /> : null}
      <p className="mt-4 font-medium">This course includes</p>
      <ul className="mt-2 flex flex-col gap-2">
        {included.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-progress" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-3">
        <Button asChild className="w-full whitespace-normal text-center">
          <Link to={action.to}>{action.label}</Link>
        </Button>
        {secondary ? (
          <Button variant="secondary" asChild className="w-full">
            <Link to={secondary.to}>{secondary.label}</Link>
          </Button>
        ) : null}
      </div>
    </aside>
  )
}

export default function CoursePage() {
  const { data, user, progress } = useAppState()
  const { hash } = useLocation()
  const counts = courseCounts(data)
  const hashEpisode = /^#episode-(\d+)$/.exec(hash)?.[1]
  const openEpisodes = hashEpisode
    ? [`episode-${hashEpisode}`]
    : data.episodes[0]
      ? [`episode-${data.episodes[0].id}`]
      : []
  // Controlled so an #episode-N link followed while already on this page (header Course menu) opens it.
  const [openItems, setOpenItems] = useState<string[]>(openEpisodes)
  const [seenHash, setSeenHash] = useState(hash)
  if (hash !== seenHash) {
    setSeenHash(hash)
    if (hashEpisode && !openItems.includes(`episode-${hashEpisode}`)) setOpenItems([...openItems, `episode-${hashEpisode}`])
  }

  const meta = [
    data.course.level,
    plural(counts.episodes, 'video'),
    `${totalDurationLabel(data.episodes)} in total`,
    plural(counts.chapters, 'chapter'),
    plural(counts.labs, 'lab'),
    counts.hasFinal ? 'Quizzes and certificate' : 'Quizzes',
  ]
  const totalSec = courseDuration(data)

  return (
    <>
      <PageBand
        title={data.course.title}
        size="lg"
        cover={COURSE_COVER}
        eyebrow={`${data.course.level} course by ${data.course.instructorOrg}`}
        lede={data.course.summary}
      >
        <ul aria-label="Course details" className="mt-6 flex flex-wrap gap-2">
          {meta.map((m) => (
            <li key={m}>
              <Badge tone="primary">{m}</Badge>
            </li>
          ))}
        </ul>
        {/* Course spine: one segment per episode, as long as the episode's share of the running time. */}
        <div aria-hidden="true" className="mt-8 flex max-w-xl gap-1.5">
          {data.episodes.map((e) => {
            const share = totalSec > 0 ? e.durationSec / totalSec : 1 / data.episodes.length
            return (
              <span key={e.id} className="flex min-w-0 flex-col gap-2" style={{ flexGrow: share, flexBasis: 0 }}>
                <span className={cn('h-1.5 rounded-full', coverFor(e).accent)} />
                <span className="truncate font-mono text-xs text-on-ink-muted">{episodeLabel(e.number)}</span>
              </span>
            )
          })}
        </div>
      </PageBand>

      <Container className="pb-16 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_21rem]">
          <div className="min-w-0 pt-10 md:pt-14">
            {data.course.notice ? (
              <Callout tone="info" title="Good to know" className="mb-10">
                <p>{data.course.notice}</p>
              </Callout>
            ) : null}

            <div className="mb-12 lg:hidden">
              <EnrolCard />
            </div>

            <Reveal as="section" labelledBy="learn-heading">
              <h2 id="learn-heading" className="text-[30px] leading-[1.05] md:text-[40px]">
                What you'll learn
              </h2>
              <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                {data.episodes.map((e, i) => (
                  <li
                    key={e.id}
                    className={cn(
                      'relative overflow-hidden rounded-panel border border-border bg-card p-5 pl-6 shadow-raised',
                      // Odd count: the last card spans the row instead of leaving a hole.
                      data.episodes.length % 2 === 1 && i === data.episodes.length - 1 && 'sm:col-span-2',
                    )}
                  >
                    <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', coverFor(e).accent)} />
                    <span className="font-mono text-sm font-semibold text-muted-foreground">{episodeLabel(e.number)}</span>
                    <span className="mt-1 block font-display text-lg font-bold tracking-[-0.01em]">{e.title}</span>
                    <ul className="mt-3 flex flex-col gap-1.5 text-muted-foreground">
                      {e.outcomes.map((o) => (
                        <li key={o} className="flex gap-2">
                          <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-progress" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal as="section" labelledBy="curriculum-heading" className="mt-16">
              <h2 id="curriculum-heading" className="text-[30px] leading-[1.05] md:text-[40px]">
                Curriculum
              </h2>
              <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="mt-6 flex flex-col gap-4">
                {data.episodes.map((m) => {
                  const cover = coverFor(m)
                  const state = user ? watchState(progress, m) : 'not-started'
                  const ratio = user ? watchRatio(progress, m) : 0
                  const chapters = m.chapters ?? []
                  const timed = timedChapters(m)
                  return (
                    <AccordionItem
                      key={m.id}
                      value={`episode-${m.id}`}
                      id={`episode-${m.id}`}
                      className="scroll-mt-24 overflow-hidden rounded-panel border border-border bg-card shadow-raised"
                    >
                      <AccordionTrigger className="px-4 sm:px-5">
                        <span className="flex min-w-0 items-center gap-4">
                          <span
                            aria-hidden="true"
                            className="relative hidden aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-control sm:block"
                          >
                            <img
                              src={cover.src}
                              srcSet={cover.srcSet}
                              sizes="96px"
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover"
                            />
                            <span className={cn('absolute inset-x-0 bottom-0 h-1', cover.accent)} />
                          </span>
                          <span className="flex min-w-0 flex-col gap-1">
                            <span className="flex items-center gap-2 font-mono text-sm font-semibold text-muted-foreground">
                              <span aria-hidden="true" className={cn('h-1 w-5 rounded-full sm:hidden', cover.accent)} />
                              {episodeLabel(m.number)}
                            </span>
                            <span className="flex flex-wrap items-center gap-2 font-display text-xl font-bold tracking-[-0.01em]">
                              {m.title}
                              {isOptionalEpisode(m) ? <Badge tone="outline">Optional</Badge> : null}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span aria-hidden="true">{durationLabel(m.durationSec, m.durationApprox)}</span>
                              <span className="sr-only">{spokenDurationLabel(m.durationSec, m.durationApprox)}</span>
                              {chapters.length > 0 ? `, ${plural(chapters.length, 'chapter')}` : ''}
                              {state === 'watched' ? ', watched' : state === 'partly' ? `, ${Math.round(ratio * 100)}% watched` : ''}
                            </span>
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="border-t border-border px-4 pt-4 sm:px-5">
                        <p className="max-w-[62ch] text-muted-foreground">
                          <span className="font-semibold text-foreground">Covers: </span>
                          {m.summary}
                        </p>
                        {state === 'partly' ? (
                          <Progress
                            value={Math.round(ratio * 100)}
                            max={100}
                            label={`${m.title} watched`}
                            className="mt-3 max-w-48"
                          />
                        ) : null}
                        {chapters.length > 0 ? (
                          <ol
                            aria-label={`${episodeLabel(m.number)} chapters`}
                            className="mt-4 divide-y divide-border border-y border-border"
                          >
                            {chapters.map((c, i) => (
                              <li key={c.label} className="flex items-baseline gap-3 py-2.5">
                                <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">
                                  {timed[i] ? formatDuration(timed[i].t) : i + 1}
                                </span>
                                <span>{c.label}</span>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Link to={`/learn/${m.id}`} className="link inline-flex min-h-11 items-center gap-2">
                            Open {episodeLabel(m.number)}
                            <span className="sr-only">: {m.title}</span>
                            <ArrowRight aria-hidden="true" strokeWidth={1.75} className="size-4" />
                          </Link>
                          {m.labId ? (
                            <Badge tone="neutral">
                              <FlaskConical aria-hidden="true" strokeWidth={1.75} />
                              Lab
                            </Badge>
                          ) : null}
                          {state === 'watched' ? (
                            <Badge tone="primary">
                              <CheckCircle2 aria-hidden="true" strokeWidth={1.75} />
                              Watched
                            </Badge>
                          ) : null}
                          {state === 'partly' ? (
                            <Badge tone="neutral">
                              <CircleDashed aria-hidden="true" strokeWidth={1.75} />
                              {Math.round(ratio * 100)}% watched
                            </Badge>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </Reveal>

            <section aria-labelledby="before-heading" className="mt-16">
              <h2 id="before-heading" className="text-[30px] leading-[1.05] md:text-[40px]">
                Before you start
              </h2>
              <ul className="mt-5 flex list-disc flex-col gap-2 pl-6 marker:text-progress">
                {data.course.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="instructor-heading"
              className="ink-scope on-ink mt-16 flex flex-col gap-5 rounded-panel bg-ink p-6 shadow-lift sm:flex-row sm:items-center sm:p-8"
            >
              <span
                aria-hidden="true"
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-volt font-mono text-2xl font-semibold text-ink"
              >
                {data.course.instructor.charAt(0)}
              </span>
              <div>
                <h2 id="instructor-heading" className="text-[24px]">
                  Instructor
                </h2>
                <p className="mt-1 font-semibold">
                  {data.course.instructor}, {data.course.instructorOrg}
                </p>
                <p className="mt-1 max-w-[60ch] text-on-ink-muted">{site.instructorBio}</p>
              </div>
            </section>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 z-10 -mt-44">
              <EnrolCard />
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}
