import { ArrowRight, FlaskConical } from 'lucide-react'
import { Link } from 'react-router'
import { LabServiceIcons } from '@/components/art/LabServiceIcons'
import { LabStatusLabel } from '@/components/LabStatusLabel'
import { coverFor, PART_COVERS } from '@/components/media/partCovers'
import { Container } from '@/components/misc'
import { PageBand } from '@/components/PageBand'
import { Callout } from '@/components/ui/callout'
import { getEpisode } from '@/data'
import { useAppState } from '@/context/useAppState'
import { labStatus, labStepCount } from '@/lib/progress'
import { cn, plural } from '@/lib/utils'

export default function LabsPage() {
  const { data, user, progress } = useAppState()
  const groups = data.parts
    .map((part) => ({
      part,
      labs: data.labs.filter((lab) => getEpisode(data, lab.episodeId)?.partId === part.id),
    }))
    .filter((g) => g.labs.length > 0)

  return (
    <>
      <PageBand
        title="Labs"
        eyebrow="Hands-on practice"
        cover={PART_COVERS.forest}
        accent="bg-theme-forest"
        figure={PART_COVERS.forest}
        lede={`${plural(data.labs.length, 'guided lab')}. Tick off each step as you go; your progress is saved in this browser.`}
      >
        {!user ? (
          <p className="mt-4 text-on-ink-muted">
            <Link to="/login?next=%2Flabs" className="link">
              Log in
            </Link>{' '}
            to open a lab and track your progress.
          </p>
        ) : null}
      </PageBand>

      <Container className="py-12 md:py-16">
        {groups.length === 0 ? (
          <Callout title="No labs yet">
            <p>Labs for this course have not been published yet. Check back after the lessons are released.</p>
          </Callout>
        ) : (
          <div className="flex flex-col gap-14">
            {groups.map(({ part, labs }) => {
              const cover = coverFor(part)
              return (
                <section key={part.id} aria-labelledby={`labs-part-${part.id}`}>
                  <p className="flex items-center gap-3 font-mono text-sm font-semibold text-muted-foreground">
                    <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', cover.accent)} />
                    Part {part.id}
                  </p>
                  <h2 id={`labs-part-${part.id}`} className="mt-2 text-[28px] leading-[1.05] md:text-[36px]">
                    {part.title}
                  </h2>
                  <ul className="mt-6 flex flex-col gap-4">
                    {labs.map((lab) => {
                      const episode = getEpisode(data, lab.episodeId)
                      const done = labStepCount(progress, lab.id)
                      return (
                        <li key={lab.id}>
                          <Link
                            to={`/labs/${lab.id}`}
                            className="card-lift group relative flex flex-col gap-4 overflow-hidden rounded-panel border border-border bg-card p-5 pl-6 hover:border-foreground sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', cover.accent)} />
                            <span className="flex gap-3">
                              <FlaskConical aria-hidden="true" strokeWidth={1.75} className="mt-1 size-5 shrink-0 text-link" />
                              <span>
                                <span className="block font-display text-lg font-bold">{lab.title}</span>
                                <span className="block text-sm text-muted-foreground">
                                  {episode ? `${episode.title}, ` : ''}
                                  {plural(lab.steps.length, 'step')}
                                </span>
                              </span>
                            </span>
                            <span className="flex flex-wrap items-center gap-4">
                              <LabServiceIcons services={lab.services} />
                              {user ? (
                                <LabStatusLabel
                                  status={labStatus(progress, lab.id, lab.steps.length)}
                                  done={done}
                                  total={lab.steps.length}
                                />
                              ) : null}
                              <ArrowRight
                                aria-hidden="true"
                                strokeWidth={1.75}
                                className="hidden size-5 transition-transform duration-[120ms] group-hover:translate-x-1 sm:block"
                              />
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </Container>
    </>
  )
}
