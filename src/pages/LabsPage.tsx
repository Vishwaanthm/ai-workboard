import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router'
import { LabServiceIcons } from '@/components/art/LabServiceIcons'
import { LabStatusLabel } from '@/components/LabStatusLabel'
import { Container } from '@/components/misc'
import { PageHeading } from '@/components/PageHeading'
import { Callout } from '@/components/ui/callout'
import { getEpisode } from '@/data'
import { useAppState } from '@/context/useAppState'
import { labStatus, labStepCount } from '@/lib/progress'
import { plural } from '@/lib/utils'

export default function LabsPage() {
  const { data, user, progress } = useAppState()
  const groups = data.parts
    .map((part) => ({
      part,
      labs: data.labs.filter((lab) => getEpisode(data, lab.episodeId)?.partId === part.id),
    }))
    .filter((g) => g.labs.length > 0)

  return (
    <Container className="py-10 md:py-14">
      <PageHeading title="Labs" />
      <p className="mt-4 max-w-[62ch] text-lg text-muted-foreground">
        {plural(data.labs.length, 'guided lab')}. Tick off each step as you go; your progress is saved in this
        browser.
      </p>
      {!user ? (
        <p className="mt-2 text-muted-foreground">
          <Link to="/login?next=%2Flabs" className="font-medium text-primary underline underline-offset-4">
            Log in
          </Link>{' '}
          to open a lab and track your progress.
        </p>
      ) : null}

      {groups.length === 0 ? (
        <Callout title="No labs yet" className="mt-10">
          <p>Labs for this course have not been published yet. Check back after the lessons are released.</p>
        </Callout>
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          {groups.map(({ part, labs }) => (
            <section key={part.id} aria-labelledby={`labs-part-${part.id}`}>
              <h2 id={`labs-part-${part.id}`} className="text-[22px] md:text-[28px]">
                {part.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {labs.map((lab) => {
                  const episode = getEpisode(data, lab.episodeId)
                  const done = labStepCount(progress, lab.id)
                  return (
                    <li key={lab.id}>
                      <Link
                        to={`/labs/${lab.id}`}
                        className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5 transition-colors duration-[120ms] hover:border-primary sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="flex gap-3">
                          <FlaskConical aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-primary" />
                          <span>
                            <span className="block font-semibold">{lab.title}</span>
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
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  )
}
