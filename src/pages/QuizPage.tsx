import { ArrowRight, CheckCircle2, Lock, RotateCcw, XCircle } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { COURSE_COVER, coverFor } from '@/components/media/partCovers'
import { Container, NotFound } from '@/components/misc'
import { PageBand } from '@/components/PageBand'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { finalQuiz, getEpisode, getPart, getQuiz } from '@/data'
import type { Quiz } from '@/data/types'
import { useAppState } from '@/context/useAppState'
import { isEligible, isQuizUnlocked, quizzesBlockingFinal } from '@/lib/progress'
import { isPassingScore, passMarkOf } from '@/lib/schema'
import { cn } from '@/lib/utils'

function percent(n: number): string {
  return `${Math.round(n * 100)}%`
}

function QuizForm({ quiz }: { quiz: Quiz }) {
  const { data, progress, recordQuiz } = useAppState()
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => quiz.questions.map(() => undefined))
  const [result, setResult] = useState<{ correct: number } | null>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)
  const total = quiz.questions.length
  const answered = answers.filter((a) => a !== undefined).length
  const allAnswered = answered === total
  const record = progress.quizzes[quiz.id]
  const passMark = passMarkOf(quiz.passMark)

  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!allAnswered) return
    const correct = quiz.questions.filter((q, i) => answers[i] === q.answerIndex).length
    recordQuiz(quiz, correct)
    setResult({ correct })
  }

  const retake = () => {
    setAnswers(quiz.questions.map(() => undefined))
    setResult(null)
  }

  const passed = result ? isPassingScore(result.correct, total, quiz.passMark) : false
  const final = finalQuiz(data)
  const reviewing = result !== null

  return (
    <>
      <ul aria-label="Quiz details" className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-muted-foreground">
        <li>{total} questions</li>
        <li>Pass mark {percent(passMark)}</li>
        <li>{record ? `Best score ${record.best} of ${total}` : 'Not taken yet'}</li>
      </ul>

      {result ? (
        <section
          aria-labelledby="result-heading"
          className={cn(
            'mt-8 rounded-panel border p-5 sm:p-6',
            passed ? 'border-progress bg-primary-soft' : 'border-destructive/30 bg-destructive-soft',
          )}
        >
          <h2 id="result-heading" ref={resultRef} tabIndex={-1} className="flex items-center gap-2 text-[22px] outline-none">
            {passed ? (
              <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-6 text-progress" />
            ) : (
              <XCircle aria-hidden="true" strokeWidth={1.75} className="size-6 text-destructive-soft-foreground" />
            )}
            {passed ? 'Passed' : 'Not passed yet'}
          </h2>
          <p className={cn('mt-2', passed ? 'text-foreground' : 'text-destructive-soft-foreground')}>
            You scored {result.correct} of {total} ({percent(result.correct / total)}).
            {passed ? '' : ` You need ${percent(passMark)} to pass. Review the answers below and try again.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={retake}>
              <RotateCcw aria-hidden="true" strokeWidth={1.75} />
              Retake quiz
            </Button>
            {passed && quiz.partId !== 'final' && final && isQuizUnlocked(progress, data, final) ? (
              <Button asChild>
                <Link to={`/quiz/${final.id}`}>
                  Take the {final.title}
                  <ArrowRight aria-hidden="true" strokeWidth={1.75} />
                </Link>
              </Button>
            ) : null}
            {passed && quiz.partId === 'final' ? (
              <Button asChild>
                <Link to="/certificate">
                  {isEligible(progress, data) ? 'Get your certificate' : 'See what is left for your certificate'}
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <form onSubmit={submit} className="mt-8 flex flex-col gap-6" noValidate>
        {quiz.questions.map((q, qi) => {
          const chosen = answers[qi]
          const isRight = chosen === q.answerIndex
          const linked = q.episodeId !== undefined ? getEpisode(data, q.episodeId) : undefined
          return (
            <fieldset key={q.id} className="rounded-panel border border-border bg-card p-5 shadow-raised sm:p-6">
              <legend className="w-full">
                <span className="block font-mono text-sm font-semibold text-muted-foreground">
                  Question {qi + 1} of {total}
                </span>
                <span className="mt-1 block font-display text-xl font-bold">{q.prompt}</span>
              </legend>
              <div className="mt-4 flex flex-col gap-2">
                {q.options.map((option, oi) => {
                  const id = `${quiz.id}-${q.id}-${oi}`
                  const showCorrect = reviewing && oi === q.answerIndex
                  const showWrong = reviewing && oi === chosen && !isRight
                  return (
                    <label
                      key={oi}
                      htmlFor={id}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-control border px-3 py-2 transition-colors duration-[120ms]',
                        reviewing ? 'cursor-default' : 'cursor-pointer hover:bg-primary-soft',
                        showCorrect
                          ? 'border-progress bg-primary-soft'
                          : showWrong
                            ? 'border-destructive bg-destructive-soft'
                            : 'border-border',
                      )}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`${quiz.id}-${q.id}`}
                        value={oi}
                        checked={chosen === oi}
                        disabled={reviewing}
                        onChange={() =>
                          setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                        }
                        className="size-5 shrink-0 accent-primary"
                      />
                      <span className="flex-1">{option}</span>
                      {showCorrect ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-hover">
                          <CheckCircle2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                          Correct answer
                        </span>
                      ) : null}
                      {showWrong ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive-soft-foreground">
                          <XCircle aria-hidden="true" strokeWidth={1.75} className="size-4" />
                          Your answer
                        </span>
                      ) : null}
                    </label>
                  )
                })}
              </div>
              {reviewing ? (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="font-medium">{isRight ? 'You got this right.' : 'You got this wrong.'}</p>
                  <p className="mt-1 text-muted-foreground">{q.explanation}</p>
                  {linked ? (
                    <Link
                      to={`/learn/${linked.id}`}
                      className="link mt-2 inline-flex min-h-11 items-center"
                    >
                      Review {linked.title}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </fieldset>
          )
        })}

        {!reviewing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Button type="submit" size="lg" disabled={!allAnswered} aria-describedby="submit-hint">
              Submit answers
            </Button>
            <p id="submit-hint" className="text-muted-foreground">
              {allAnswered
                ? 'All questions answered.'
                : `Answer all questions to submit (${answered} of ${total} answered).`}
            </p>
          </div>
        ) : null}
      </form>
    </>
  )
}

export default function QuizPage() {
  const { quizId } = useParams()
  const { data, progress } = useAppState()
  const quiz = quizId ? getQuiz(data, quizId) : undefined
  if (!quiz) return <NotFound />

  const part = quiz.partId === 'final' ? undefined : getPart(data, quiz.partId)
  const unlocked = isQuizUnlocked(progress, data, quiz)
  const blocking = quizzesBlockingFinal(progress, data)

  const cover = part ? coverFor(part) : undefined

  return (
    <>
      <PageBand
        title={quiz.title}
        cover={cover ?? COURSE_COVER}
        accent={cover?.accent}
        eyebrow={part ? `Part ${part.id}: ${part.title}` : 'Final assessment'}
      />
    <Container className="py-10 md:py-14">
      <div className="max-w-3xl">
        {unlocked ? (
          <QuizForm key={quiz.id} quiz={quiz} />
        ) : (
          <Callout tone="info" title="Locked until you pass every part quiz">
            <p>Pass these first:</p>
            <ul className="mt-2 flex flex-col">
              {blocking.map((q) => (
                <li key={q.id}>
                  <Link
                    to={`/quiz/${q.id}`}
                    className="link inline-flex min-h-11 items-center gap-2"
                  >
                    <Lock aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    {q.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Callout>
        )}
      </div>
    </Container>
    </>
  )
}
