import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { LabServiceIcons } from '@/components/art/LabServiceIcons'
import { CodeBlock } from '@/components/CodeBlock'
import { Container, NotFound } from '@/components/misc'
import { PageHeading } from '@/components/PageHeading'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Progress } from '@/components/ui/progress'
import { getLab, getEpisode } from '@/data'
import { useAppState } from '@/context/useAppState'
import { isStepDone, labStepCount } from '@/lib/progress'
import { usePrefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

export default function LabPage() {
  const { labId } = useParams()
  const { data, progress, setStepDone, resetLab } = useAppState()
  const reduced = usePrefersReducedMotion()
  const [justTicked, setJustTicked] = useState<string | null>(null)
  const lab = labId ? getLab(data, labId) : undefined
  if (!lab) return <NotFound />

  const episode = getEpisode(data, lab.episodeId)
  const total = lab.steps.length
  const doneCount = labStepCount(progress, lab.id)

  const toggleStep = (stepId: string, checked: boolean) => {
    setStepDone(lab.id, stepId, checked)
    setJustTicked(checked ? stepId : null)
    const after = doneCount + (checked ? 1 : -1)
    if (checked && after === total) toast.success(`Lab complete: ${lab.title}`)
  }

  return (
    <Container className="py-10 md:py-14">
      <div className="max-w-3xl">
        <Button variant="link" asChild>
          <Link to="/labs">
            <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
            All labs
          </Link>
        </Button>
        <PageHeading title={lab.title} className="mt-2" />
        {episode ? (
          <p className="mt-3 text-muted-foreground">
            Lab for{' '}
            <Link to={`/learn/${episode.id}`} className="font-medium text-primary underline underline-offset-4">
              {episode.title}
            </Link>
          </p>
        ) : null}
        <LabServiceIcons services={lab.services} size="lg" withLabels className="mt-5" />
        <ul aria-label="Topics" className="mt-4 flex flex-wrap gap-2">
          {lab.tags.map((tag) => (
            <li key={tag}>
              <Badge tone="neutral">{tag}</Badge>
            </li>
          ))}
        </ul>

        {lab.untested ? (
          <Callout tone="caution" title="Untested" className="mt-6">
            <p>This lab has not been run end to end yet. If a step fails, check the error message before moving on.</p>
          </Callout>
        ) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section aria-labelledby="objectives-heading">
            <h2 id="objectives-heading" className="text-[22px]">
              What you will do
            </h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-6 marker:text-progress">
              {lab.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="prereq-heading">
            <h2 id="prereq-heading" className="text-[22px]">
              Before you start
            </h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-6 marker:text-progress">
              {lab.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        </div>

        <Callout title="Cost" className="mt-6">
          <p>{lab.costNote}</p>
        </Callout>

        <section aria-labelledby="steps-heading" className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="steps-heading" className="text-[22px] md:text-[28px]">
              Steps
            </h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {doneCount} of {total} steps done
            </p>
          </div>
          <Progress value={doneCount} max={total} label="Lab steps done" className="mt-3" />
          <ol className="mt-6 flex flex-col gap-4">
            {lab.steps.map((step, index) => {
              const checked = isStepDone(progress, lab.id, step.id)
              const inputId = `step-${lab.id}-${step.id}`
              return (
                <li
                  key={step.id}
                  className={cn(
                    'rounded-panel border bg-card p-4 transition-colors duration-[120ms] sm:p-5',
                    checked ? 'border-progress' : 'border-border',
                  )}
                >
                  {step.caution ? (
                    <Callout tone="caution" title="Before you continue" className="mb-4">
                      <p>{step.caution}</p>
                    </Callout>
                  ) : null}
                  <label htmlFor={inputId} className="flex min-h-11 cursor-pointer items-start gap-3">
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleStep(step.id, e.target.checked)}
                      className="mt-0.5 size-6 shrink-0 cursor-pointer rounded-checkbox accent-primary"
                    />
                    <span>
                      <span className="flex items-center gap-2 font-semibold">
                        <span>
                          <span className="font-mono text-muted-foreground">{index + 1}.</span> {step.title}
                        </span>
                        {checked ? (
                          <CheckCircle2
                            aria-hidden="true"
                            strokeWidth={1.75}
                            data-testid="step-badge"
                            className={cn(
                              'size-5 shrink-0 text-progress',
                              !reduced && justTicked === step.id && 'step-badge--pop',
                            )}
                          />
                        ) : null}
                      </span>
                      <span className={cn('mt-1 block', checked ? 'text-muted-foreground' : '')}>{step.detail}</span>
                    </span>
                  </label>
                  {step.code ? (
                    <div className="mt-4 sm:pl-9">
                      <CodeBlock label={step.code.label} lang={step.code.lang} code={step.code.code} />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </section>

        <section aria-labelledby="expected-heading" className="mt-10">
          <h2 id="expected-heading" className="text-[22px]">
            Expected outcome
          </h2>
          <p className="mt-3 max-w-[62ch]">{lab.expected}</p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">
          {episode ? (
            <Button variant="secondary" asChild>
              <Link to={`/learn/${episode.id}`}>Back to the lesson</Link>
            </Button>
          ) : null}
          <ConfirmDialog
            trigger={
              <Button variant="ghost" disabled={doneCount === 0}>
                <RotateCcw aria-hidden="true" strokeWidth={1.75} />
                Reset lab
              </Button>
            }
            title="Reset this lab?"
            description="All ticked steps in this lab will be cleared. Your other progress stays."
            confirmLabel="Reset lab"
            onConfirm={() => {
              resetLab(lab.id)
              toast.success('Lab reset')
            }}
          />
        </div>
      </div>
    </Container>
  )
}
