import { CheckCircle2, CircleDashed, FlaskConical } from 'lucide-react'
import { useId } from 'react'
import { Link, useLocation } from 'react-router'
import { PartMotif } from '@/components/art/PartMotif'
import { ProgressRing } from '@/components/art/ProgressRing'
import { SectionBackdrop } from '@/components/art/SectionBackdrop'
import { Container } from '@/components/misc'
import { Reveal } from '@/components/motion/Reveal'
import { PageHeading } from '@/components/PageHeading'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Progress } from '@/components/ui/progress'
import { ContinueWatching } from '@/components/video/ContinueWatching'
import { courseCounts, episodesInPart, firstLesson, isOptionalEpisode } from '@/data'
import { site } from '@/data/site'
import { useAppState } from '@/context/useAppState'
import {
  coreProgress,
  hasAnyProgress,
  nextStep,
  nextStepHref,
  visibleCertificate,
} from '@/lib/progress'
import { plural } from '@/lib/utils'
import {
  durationLabel,
  episodeLabel,
  partDuration,
  spokenDurationLabel,
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
    `${plural(counts.partQuizzes, 'part quiz', 'part quizzes')}${counts.hasFinal ? ' and a final assessment' : ''}`,
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
    <aside aria-labelledby={headingId} className="rounded-panel border border-border bg-card p-6 shadow-raised">
      <h2 id={headingId} className="text-[22px]">
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
  const hashPart = /^#part-(\d+)$/.exec(hash)?.[1]
  const openParts = hashPart ? [`part-${hashPart}`] : data.parts[0] ? [`part-${data.parts[0].id}`] : []

  const meta = [
    data.course.level,
    plural(counts.parts, 'part'),
    plural(counts.episodes, 'episode'),
    `${totalDurationLabel(data.episodes)} of video`,
    plural(counts.labs, 'lab'),
    counts.hasFinal ? 'Quizzes and certificate' : 'Quizzes',
  ]

  return (
    <div className="relative isolate overflow-hidden">
      <SectionBackdrop variant="topo" className="h-[28rem]" />
    <Container className="py-10 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <PageHeading title={data.course.title} />
          <p className="mt-4 max-w-[62ch] text-lg text-muted-foreground">{data.course.summary}</p>
          <ul aria-label="Course details" className="mt-5 flex flex-wrap gap-2">
            {meta.map((m) => (
              <li key={m}>
                <Badge tone="primary">{m}</Badge>
              </li>
            ))}
          </ul>

          {data.course.notice ? (
            <Callout tone="info" title="Good to know" className="mt-6">
              <p>{data.course.notice}</p>
            </Callout>
          ) : null}

          <div className="mt-8 lg:hidden">
            <EnrolCard />
          </div>

          <Reveal as="section" labelledBy="learn-heading" className="mt-12">
            <h2 id="learn-heading" className="text-[22px] md:text-[28px]">
              What you'll learn
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {data.parts.map((part) => (
                <li key={part.id} className="flex gap-3">
                  <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-progress" />
                  <span>{part.outcome}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" labelledBy="curriculum-heading" className="mt-12">
            <h2 id="curriculum-heading" className="text-[22px] md:text-[28px]">
              Curriculum
            </h2>
            <Accordion type="multiple" defaultValue={openParts} className="mt-4 border-t border-border">
              {data.parts.map((part, partIndex) => {
                const eps = episodesInPart(data, part.id)
                const total = partDuration(data, part.id)
                return (
                  <AccordionItem key={part.id} value={`part-${part.id}`} id={`part-${part.id}`}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-4">
                      <PartMotif motif={part.motif} index={partIndex} className="size-9" />
                      <span className="flex flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                          {part.title}
                          {part.optional ? <Badge tone="outline">Optional</Badge> : null}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {plural(eps.length, 'episode')}, <span aria-hidden="true">{totalDurationLabel(eps)}</span>
                          <span className="sr-only">{spokenDurationLabel(total, eps.some((e) => e.durationApprox))}</span>
                        </span>
                      </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ol className="flex flex-col gap-1">
                        {eps.map((m) => {
                          const state = user ? watchState(progress, m) : 'not-started'
                          const ratio = user ? watchRatio(progress, m) : 0
                          return (
                            <li key={m.id}>
                              <Link
                                to={`/learn/${m.id}`}
                                className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-control px-2 py-2 transition-colors duration-[120ms] hover:bg-primary-soft"
                              >
                                <span className="flex min-w-0 gap-3">
                                  <span className="mt-0.5 w-8 shrink-0 font-mono text-sm text-muted-foreground">
                                    {episodeLabel(m.number)}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="font-medium">{m.title}</span>
                                    <span className="block text-sm text-muted-foreground">{m.summary}</span>
                                    {state === 'partly' ? (
                                      <Progress
                                        value={Math.round(ratio * 100)}
                                        max={100}
                                        label={`${m.title} watched`}
                                        className="mt-2 max-w-48"
                                      />
                                    ) : null}
                                  </span>
                                </span>
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    <span aria-hidden="true">{durationLabel(m.durationSec, m.durationApprox)}</span>
                                    <span className="sr-only">{spokenDurationLabel(m.durationSec, m.durationApprox)}</span>
                                  </span>
                                  {m.labId ? (
                                    <Badge tone="neutral">
                                      <FlaskConical aria-hidden="true" strokeWidth={1.75} />
                                      Lab
                                    </Badge>
                                  ) : null}
                                  {isOptionalEpisode(data, m) && !part.optional ? <Badge tone="outline">Optional</Badge> : null}
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
                                </span>
                              </Link>
                            </li>
                          )
                        })}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </Reveal>

          <section aria-labelledby="before-heading" className="mt-12">
            <h2 id="before-heading" className="text-[22px] md:text-[28px]">
              Before you start
            </h2>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-6 marker:text-progress">
              {data.course.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="instructor-heading" className="mt-12 flex gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-2xl font-semibold text-primary-foreground"
            >
              {data.course.instructor.charAt(0)}
            </span>
            <div>
              <h2 id="instructor-heading" className="text-[22px]">
                Instructor
              </h2>
              <p className="mt-1 font-semibold">
                {data.course.instructor}, {data.course.instructorOrg}
              </p>
              <p className="mt-1 max-w-[60ch] text-muted-foreground">{site.instructorBio}</p>
            </div>
          </section>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <EnrolCard />
          </div>
        </div>
      </div>
    </Container>
    </div>
  )
}
