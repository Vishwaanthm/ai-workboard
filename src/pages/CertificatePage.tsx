import { Award, CheckCircle2, Circle, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { COURSE_COVER } from '@/components/media/covers'
import { Container } from '@/components/misc'
import { PageBand } from '@/components/PageBand'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { Progress } from '@/components/ui/progress'
import { useAppState } from '@/context/useAppState'
import { certificateEligibility, coreProgress, visibleCertificate, type Requirement } from '@/lib/progress'
import { episodeQuizzes, finalQuiz } from '@/data'
import { formatIssueDate } from '@/lib/utils'

function requirementLink(r: Requirement): { label: string; to: string } {
  if (r.kind === 'episode') return { label: `Complete ${r.episode.title}`, to: `/learn/${r.episode.id}` }
  return { label: `Pass the ${r.quiz.title}`, to: `/quiz/${r.quiz.id}` }
}

export default function CertificatePage() {
  const { data, progress, issueCertificate } = useAppState()
  const unmet = certificateEligibility(progress, data)
  const eligible = unmet.length === 0
  const certificate = visibleCertificate(progress, data)
  const [justIssued, setJustIssued] = useState(false)
  const [issueFailed, setIssueFailed] = useState(false)
  const attempted = useRef(false)

  useEffect(() => {
    if (eligible && !certificate && !attempted.current) {
      attempted.current = true
      if (issueCertificate()) setJustIssued(true)
      else setIssueFailed(true)
    }
  }, [eligible, certificate, issueCertificate])

  if (!certificate) {
    const { done, total } = coreProgress(progress, data)
    const quizCount = episodeQuizzes(data).length + (finalQuiz(data) ? 1 : 0)
    const requirementsTotal = total + quizCount
    const met = requirementsTotal - unmet.length
    return (
      <>
      <PageBand
        title="Certificate"
        cover={COURSE_COVER}
        eyebrow={data.course.title}
        lede={eligible ? undefined : 'Your certificate unlocks when you complete every required episode and pass every quiz.'}
      />
      <Container className="py-10 md:py-14">
        <div className="max-w-3xl">
          {eligible && issueFailed ? (
            <Callout tone="error" title="Your certificate could not be saved">
              <p>
                This browser is not saving data, so the certificate cannot be issued. Allow site data for this
                page, then reload.
              </p>
            </Callout>
          ) : eligible ? (
            <p className="text-muted-foreground" role="status">
              Preparing your certificate.
            </p>
          ) : (
            <>
              <div className="rounded-panel border border-border bg-card p-5 shadow-raised sm:p-6">
                <p className="font-medium">
                  {met} of {requirementsTotal} requirements met
                </p>
                <Progress value={met} max={requirementsTotal} label="Certificate requirements met" className="mt-3" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {done} of {total} required episodes complete
                </p>
                <h2 className="mt-6 text-[22px]">Still to do</h2>
                <ul className="mt-3 flex flex-col">
                  {unmet.map((r) => {
                    const { label, to } = requirementLink(r)
                    return (
                      <li key={to}>
                        <Link
                          to={to}
                          className="link inline-flex min-h-11 items-center gap-2"
                        >
                          <Circle aria-hidden="true" strokeWidth={1.75} className="size-5 text-input" />
                          {label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          )}
        </div>
      </Container>
      </>
    )
  }

  return (
    <>
      <PageBand
        title="Your certificate"
        className="no-print"
        cover={COURSE_COVER}
        eyebrow={data.course.title}
        lede={
          <span className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-5 text-volt" />
            Issued {formatIssueDate(certificate.issuedAt)}
          </span>
        }
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="volt" onClick={() => window.print()}>
            <Printer aria-hidden="true" strokeWidth={1.75} />
            Print
          </Button>
          <Button variant="ghostInk" asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </PageBand>
    <Container className="py-10 md:py-14 print:max-w-none print:p-0">
      <section
        aria-label="Certificate of completion"
        data-testid="certificate"
        className={`print-only-area relative mx-auto flex aspect-[1.414/1] w-full max-w-4xl flex-col justify-between overflow-hidden rounded-panel border-2 border-primary bg-card p-6 text-center shadow-lift outline outline-1 outline-offset-[-10px] outline-border sm:p-10 print:mt-0 print:w-[250mm] print:max-w-none print:shadow-none ${justIssued ? 'animate-rise-in' : ''}`}
      >
        <span aria-hidden="true" className="certificate-stripe absolute inset-x-0 top-0 h-2 bg-volt" />
        <div className="flex items-center justify-center gap-2 font-mono text-sm font-semibold text-foreground sm:text-base">
          <Award aria-hidden="true" strokeWidth={1.75} className="size-5 text-link" />
          AI Workboard (AWS)
        </div>
        <div>
          <p className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-4xl">Certificate of completion</p>
          <p className="mt-2 text-sm text-muted-foreground sm:mt-4 sm:text-base">This certifies that</p>
          <p className="mt-1 font-display text-2xl font-bold break-words text-foreground sm:mt-2 sm:text-5xl">
            {certificate.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-3 sm:text-base">has completed the course</p>
          <p className="mt-1 text-lg font-semibold sm:text-2xl">{certificate.course}</p>
        </div>
        <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
          <div>
            <dt className="text-muted-foreground">Date</dt>
            <dd className="font-medium">{formatIssueDate(certificate.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Certificate ID</dt>
            <dd className="font-mono font-medium">{certificate.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Instructor</dt>
            <dd className="font-medium">
              {data.course.instructor}, {data.course.instructorOrg}
            </dd>
          </div>
        </dl>
      </section>
      <p className="no-print mx-auto mt-4 max-w-4xl text-center text-sm text-muted-foreground">
        This is a course completion certificate from AI Workboard. It is not an AWS certification.
      </p>
    </Container>
    </>
  )
}
