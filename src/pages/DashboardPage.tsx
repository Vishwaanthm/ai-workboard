import { ArrowRight, Award, CheckCircle2, Circle, CircleDashed, Lock, RotateCcw, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { LabStatusLabel } from '@/components/LabStatusLabel'
import { ProgressRing } from '@/components/art/ProgressRing'
import { Container } from '@/components/misc'
import { PageHeading } from '@/components/PageHeading'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ContinueWatching } from '@/components/video/ContinueWatching'
import { firstLesson, isOptionalEpisode, episodesInPart, quizForPart } from '@/data'
import { useAppState } from '@/context/useAppState'
import {
  certificateEligibility,
  coreProgress,
  hasAnyProgress,
  isEpisodeComplete,
  isQuizUnlocked,
  labStatus,
  labStepCount,
  nextStep,
  nextStepHref,
  visibleCertificate,
  type NextStep,
} from '@/lib/progress'
import { formatIssueDate, plural } from '@/lib/utils'
import { durationLabel, episodeLabel, spokenDurationLabel, totalDurationLabel, watchRatio, watchState } from '@/lib/watch'

function nextStepText(step: NextStep): { title: string; action: string } {
  switch (step.kind) {
    case 'episode':
      return { title: step.episode.title, action: 'Open lesson' }
    case 'quiz':
      return { title: `Pass the ${step.quiz.title}`, action: 'Take quiz' }
    case 'final':
      return { title: `Pass the ${step.quiz.title}`, action: 'Take the final' }
    case 'certificate':
      return { title: 'Your certificate is ready', action: 'View certificate' }
    default:
      return { title: 'You have finished the course', action: 'View certificate' }
  }
}

export default function DashboardPage() {
  const { data, user, progress, resetProgress } = useAppState()
  if (!user) return null

  const started = hasAnyProgress(progress)
  const { done, total } = coreProgress(progress, data)
  const optional = data.episodes.filter((m) => isOptionalEpisode(data, m))
  const optionalDone = optional.filter((m) => isEpisodeComplete(progress, m.id)).length
  const step = nextStep(progress, data)
  const stepText = nextStepText(step)
  const certificate = visibleCertificate(progress, data)
  const unmet = certificateEligibility(progress, data)
  const firstModule = firstLesson(data)

  return (
    <Container className="py-10 md:py-14">
      <PageHeading title="Dashboard">Welcome back, {user.name}</PageHeading>
      <p className="mt-3 text-lg text-muted-foreground">{data.course.title}</p>

      {!started && firstModule ? (
        <div className="mt-8 rounded-panel border border-border bg-card p-6">
          <h2 className="text-[22px]">You have not started yet</h2>
          <p className="mt-2 max-w-[60ch] text-muted-foreground">
            Start with the first lesson. Your progress, lab steps and quiz scores are saved in this browser.
          </p>
          <Button className="mt-5" asChild>
            <Link to={`/learn/${firstModule.id}`}>
              Start {firstModule.title}
              <ArrowRight aria-hidden="true" strokeWidth={1.75} />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-panel border border-border bg-card p-6">
            <h2 className="text-[22px]">Course progress</h2>
            <div className="mt-3 flex items-center gap-4">
              <ProgressRing value={done} max={total} label="Required episodes complete" />
              <p className="font-medium">
                {done} of {total} required episodes complete
              </p>
            </div>
            {optional.length > 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Optional: {optionalDone} of {plural(optional.length, 'episode')} complete
              </p>
            ) : null}
          </div>
          <div className="rounded-panel border border-progress bg-primary-soft p-6">
            <h2 className="text-[22px]">Next step</h2>
            <p className="mt-3 font-semibold">{stepText.title}</p>
            <Button className="mt-4" asChild>
              <Link to={nextStepHref(step)}>
                {stepText.action}
                <ArrowRight aria-hidden="true" strokeWidth={1.75} />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {started ? <ContinueWatching className="mt-4 max-w-xl" /> : null}

      <section aria-labelledby="episodes-heading" className="mt-10">
        <h2 id="episodes-heading" className="text-[22px] md:text-[28px]">
          Episodes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {plural(data.episodes.length, 'episode')}, {totalDurationLabel(data.episodes)} in total
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.episodes.map((e) => {
            const state = watchState(progress, e)
            const pct = Math.round(watchRatio(progress, e) * 100)
            return (
              <li key={e.id}>
                <Link
                  to={`/learn/${e.id}`}
                  className="flex min-h-14 items-center gap-3 rounded-panel border border-border bg-card px-4 py-2 transition-colors duration-[120ms] hover:border-primary"
                >
                  {state === 'watched' ? (
                    <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-progress" />
                  ) : state === 'partly' ? (
                    <CircleDashed aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-progress" />
                  ) : (
                    <Circle aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-input" />
                  )}
                  <span className="w-8 shrink-0 font-mono text-sm text-muted-foreground">{episodeLabel(e.number)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {state === 'watched' ? 'Watched' : state === 'partly' ? `${pct}% watched` : 'Not started'}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    <span aria-hidden="true">{durationLabel(e.durationSec, e.durationApprox)}</span>
                    <span className="sr-only">{spokenDurationLabel(e.durationSec, e.durationApprox)}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="parts-heading">
          <h2 id="parts-heading" className="text-[22px] md:text-[28px]">
            Parts
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {data.parts.map((part) => {
              const mods = episodesInPart(data, part.id)
              const partDone = mods.filter((m) => isEpisodeComplete(progress, m.id)).length
              const quiz = quizForPart(data, part.id)
              const quizPassed = quiz ? (progress.quizzes[quiz.id]?.passed ?? false) : false
              return (
                <li key={part.id} className="rounded-panel border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <Link
                      to={`/course#part-${part.id}`}
                      className="inline-flex min-h-11 items-center font-semibold hover:text-primary"
                    >
                      {part.title}
                      {part.optional ? ' (optional)' : ''}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {partDone} of {plural(mods.length, 'episode')}
                    </span>
                  </div>
                  <Progress value={partDone} max={mods.length} label={`${part.title} episodes complete`} className="mt-3" />
                  {quiz ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm">
                      {quizPassed ? (
                        <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-4 text-progress" />
                      ) : (
                        <XCircle aria-hidden="true" strokeWidth={1.75} className="size-4 text-muted-foreground" />
                      )}
                      {quiz.title}: {quizPassed ? 'passed' : 'not passed yet'}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="quiz-heading">
          <h2 id="quiz-heading" className="text-[22px] md:text-[28px]">
            Quiz scores
          </h2>
          <div role="region" aria-labelledby="quiz-heading" tabIndex={0} className="mt-4 overflow-x-auto rounded-panel border border-border bg-card">
            <table className="w-full min-w-[22rem] text-left">
              <thead>
                <tr className="bg-muted text-sm">
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Quiz
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Best score
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.quizzes.map((quiz) => {
                  const record = progress.quizzes[quiz.id]
                  const unlocked = isQuizUnlocked(progress, data, quiz)
                  return (
                    <tr key={quiz.id} className="border-t border-border">
                      <td className="px-4 py-2">
                        <Link
                          to={`/quiz/${quiz.id}`}
                          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {quiz.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2 font-mono text-sm">
                        {record ? `${record.best} / ${quiz.questions.length}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {record?.passed ? (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-4 text-progress" />
                            Passed
                          </span>
                        ) : !unlocked ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Lock aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Locked
                          </span>
                        ) : record ? (
                          'Not passed yet'
                        ) : (
                          <span className="text-muted-foreground">Not taken</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section aria-labelledby="labs-heading" className="mt-10">
        <h2 id="labs-heading" className="text-[22px] md:text-[28px]">
          Labs
        </h2>
        {data.labs.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No labs have been published yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.labs.map((lab) => (
              <li key={lab.id}>
                <Link
                  to={`/labs/${lab.id}`}
                  className="flex h-full flex-col gap-2 rounded-panel border border-border bg-card p-4 transition-colors duration-[120ms] hover:border-primary"
                >
                  <span className="font-semibold">{lab.title}</span>
                  <LabStatusLabel
                    status={labStatus(progress, lab.id, lab.steps.length)}
                    done={labStepCount(progress, lab.id)}
                    total={lab.steps.length}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="cert-heading" className="mt-10">
        <h2 id="cert-heading" className="text-[22px] md:text-[28px]">
          Certificate
        </h2>
        <div className="mt-4 flex flex-col gap-4 rounded-panel border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Award
              aria-hidden="true"
              strokeWidth={1.75}
              className={certificate || unmet.length === 0 ? 'size-6 text-accent' : 'size-6 text-muted-foreground'}
            />
            <div>
              <p className="font-semibold">
                {certificate
                  ? `Issued ${formatIssueDate(certificate.issuedAt)}`
                  : unmet.length === 0
                    ? 'Ready to issue'
                    : `Locked: ${plural(unmet.length, 'requirement')} left`}
              </p>
              {certificate ? (
                <p className="font-mono text-sm text-muted-foreground">{certificate.id}</p>
              ) : null}
            </div>
          </div>
          <Button variant={certificate || unmet.length === 0 ? 'primary' : 'secondary'} asChild>
            <Link to="/certificate">
              {certificate ? 'View certificate' : unmet.length === 0 ? 'Get certificate' : 'See requirements'}
            </Link>
          </Button>
        </div>
      </section>

      {started ? (
        <div className="mt-12 border-t border-border pt-6">
          <ConfirmDialog
            trigger={
              <Button variant="ghost">
                <RotateCcw aria-hidden="true" strokeWidth={1.75} />
                Reset progress
              </Button>
            }
            title="Reset all progress?"
            description="Completed lessons, lab steps, quiz scores and your certificate will be cleared from this browser. Your account stays."
            confirmLabel="Reset progress"
            onConfirm={() => {
              resetProgress()
              toast.success('Progress reset')
            }}
          />
        </div>
      ) : null}
    </Container>
  )
}
