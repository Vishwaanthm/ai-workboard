import { ArrowRight, Award, BookOpen, FlaskConical, ListChecks } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { LabServiceIcons } from '@/components/art/LabServiceIcons'
import { Analogy } from '@/components/home/Analogy'
import { CopyCommand } from '@/components/home/CopyCommand'
import { ExploreByEpisode } from '@/components/home/ExploreByEpisode'
import { Journey } from '@/components/home/Journey'
import { LearningHub } from '@/components/home/LearningHub'
import { ModelStrip } from '@/components/home/ModelStrip'
import { HeroField } from '@/components/media/HeroField'
import { coverFor, JOURNEY_IMAGE } from '@/components/media/covers'
import { Container } from '@/components/misc'
import { Reveal } from '@/components/motion/Reveal'
import { PageHeading } from '@/components/PageHeading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { courseCounts } from '@/data'
import { home } from '@/data/home'
import { site } from '@/data/site'
import { useAppState } from '@/context/useAppState'
import { nextStep, nextStepHref } from '@/lib/progress'
import { cn, plural } from '@/lib/utils'
import { durationLabel, episodeLabel, spokenDurationLabel, totalDurationLabel } from '@/lib/watch'

/** Asymmetric 6-column bento for the episodes: 4+2, then 2+2+2. */
const CARD_SPANS = ['md:col-span-4', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-3']

const howItWorks = [
  { icon: BookOpen, title: 'Learn', text: 'Watch each video episode; it is marked complete once you have seen most of it.' },
  { icon: FlaskConical, title: 'Practice', text: 'Work through guided labs and tick off each step as you go.' },
  { icon: ListChecks, title: 'Check', text: 'Pass a short quiz after each episode, then the final assessment.' },
  { icon: Award, title: 'Certify', text: 'Print a certificate of completion with your name, date and ID.' },
]

export default function HomePage() {
  const { data, user, progress } = useAppState()
  const counts = courseCounts(data)
  const startHref = user ? nextStepHref(nextStep(progress, data)) : '/register'
  const startLabel = user ? 'Continue the course' : 'Start the course'
  const featuredLabs = data.labs.slice(0, 5)
  const heroRef = useRef<HTMLElement>(null)

  return (
    <>
      <section
        ref={heroRef}
        className="on-ink relative isolate flex min-h-[88dvh] items-end overflow-hidden bg-ink pt-28 pb-14 md:items-center md:pb-20"
      >
        {/* Layers: real-time field (back, pointer-reactive), scrim, copy (front). See HeroField. */}
        <HeroField hostRef={heroRef} />
        {/* Scrim: keeps every line of hero text at or above AA over the brightest field pixel. */}
        <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0 -z-10" />
        <Container className="hero-layer-fg relative">
          {/* A soft ink pool under the copy block, on top of the band scrim (measured in DESIGN.md). */}
          <div aria-hidden="true" className="hero-copy-scrim pointer-events-none absolute -z-10" />
          <div className="hero-rise max-w-[46rem]">
            <p className="text-sm font-semibold tracking-[0.14em] text-volt uppercase">A course by {data.course.instructorOrg}</p>
            <PageHeading
              title={data.course.title}
              className="mt-5 text-[44px] leading-[0.98] font-extrabold md:text-[68px] xl:text-[80px]"
            >
              {data.course.title}
            </PageHeading>
            <p className="mt-6 max-w-[40ch] text-lg text-on-ink md:text-xl">{site.hero.title}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" variant="volt" asChild>
                <Link to={startHref}>
                  {startLabel}
                  <ArrowRight aria-hidden="true" strokeWidth={1.75} />
                </Link>
              </Button>
              <Button size="lg" variant="ghostInk" asChild>
                <Link to="/course">View syllabus</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="map-heading" className="relative py-16 md:py-24">
        <Container>
          <Reveal className="grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-end">
            <h2 id="map-heading" className="text-[34px] leading-[1.02] md:text-[52px]">
              {plural(counts.episodes, 'video')}, {totalDurationLabel(data.episodes)}
            </h2>
            <p className="max-w-[56ch] text-lg text-muted-foreground">{data.course.summary}</p>
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-6">
            {data.episodes.map((episode, i) => {
              const cover = coverFor(episode)
              const chapters = episode.chapters?.length ?? 0
              return (
                <Reveal
                  as="li"
                  index={i}
                  key={episode.id}
                  className={cn('group relative isolate overflow-hidden rounded-panel bg-ink', CARD_SPANS[i % CARD_SPANS.length])}
                >
                  <img
                    src={cover.src}
                    srcSet={cover.srcSet}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={1280}
                    height={720}
                    className="episode-cover absolute inset-0 -z-10 size-full object-cover"
                  />
                  <div aria-hidden="true" className="episode-scrim absolute inset-0 -z-10" />
                  <Link
                    to={`/course#episode-${episode.id}`}
                    className="on-ink flex h-full min-h-72 flex-col justify-between gap-8 p-6 md:p-7"
                  >
                    <span className="flex flex-wrap items-center gap-3 text-sm font-semibold text-on-ink">
                      <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', cover.accent)} />
                      <span className="font-mono">{episodeLabel(episode.number)}</span>
                      <span className="font-mono font-normal text-on-ink-muted">
                        <span aria-hidden="true">{durationLabel(episode.durationSec, episode.durationApprox)}</span>
                        <span className="sr-only">, {spokenDurationLabel(episode.durationSec, episode.durationApprox)}</span>
                      </span>
                      {episode.optional ? <Badge tone="outline">Optional</Badge> : null}
                    </span>
                    <span>
                      <h3 className="font-display text-[28px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[34px]">
                        {episode.title}
                      </h3>
                      <span className="mt-3 block max-w-[48ch] text-on-ink-muted">{episode.summary}</span>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-on-ink">
                        {chapters > 0 ? plural(chapters, 'chapter') : 'View episode'}
                        <ArrowRight
                          aria-hidden="true"
                          strokeWidth={1.75}
                          className="size-4 transition-transform duration-[120ms] group-hover:translate-x-1"
                        />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              )
            })}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="analogy-heading" className="on-ink relative overflow-hidden bg-ink py-16 md:py-24">
        <Container>
          <Analogy analogy={home.analogy} headingId="analogy-heading" />
        </Container>
      </section>

      {home.models.providers.length > 0 ? (
        <section aria-labelledby="models-heading" className="on-ink border-t border-ink-line bg-ink py-12 md:py-16">
          <Container>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
              <h2 id="models-heading" className="text-[22px] md:text-[28px]">
                Models on Amazon Bedrock
              </h2>
              <p className="max-w-[52ch] text-on-ink-muted">{home.models.lede}</p>
            </div>
            <div className="mt-8">
              <ModelStrip providers={home.models.providers} />
            </div>
          </Container>
        </section>
      ) : null}

      <section aria-labelledby="explore-heading" className="py-16 md:py-24">
        <Container>
          <Reveal className="grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-end">
            <h2 id="explore-heading" className="text-[34px] leading-[1.02] md:text-[52px]">
              Explore by episode
            </h2>
            <p className="max-w-[56ch] text-lg text-muted-foreground">{home.explore.lede}</p>
          </Reveal>
          <div className="mt-10">
            <ExploreByEpisode data={data} snippets={home.explore.snippets} />
          </div>
        </Container>
      </section>

      {home.journey.steps.length > 0 ? (
        <section aria-labelledby="journey-heading" className="on-ink bg-ink py-16 md:py-24">
          <Container>
            <div className="grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
              <Reveal>
                <p className="font-mono text-sm font-semibold text-volt">Follow along</p>
                <h2 id="journey-heading" className="mt-3 text-[34px] leading-[1.02] md:text-[52px]">
                  {home.journey.title}
                </h2>
                <p className="mt-4 max-w-[48ch] text-lg text-on-ink-muted">{home.journey.lede}</p>
              </Reveal>
              <Reveal index={1} className="overflow-hidden rounded-panel border border-ink-line">
                <img
                  src={JOURNEY_IMAGE.src}
                  srcSet={JOURNEY_IMAGE.srcSet}
                  sizes="(min-width: 768px) 40vw, 100vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={1280}
                  height={768}
                  className="aspect-[16/7] w-full object-cover object-bottom"
                />
              </Reveal>
            </div>
            <div className="mt-12">
              <Journey data={data} steps={home.journey.steps} />
            </div>
          </Container>
        </section>
      ) : null}

      {featuredLabs.length > 0 ? (
        <section aria-labelledby="labs-heading" className="border-t border-border bg-card py-16 md:py-24">
          <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 id="labs-heading" className="text-[22px] md:text-[28px]">
                {site.labsBlurb.title}
              </h2>
              <p className="mt-3 max-w-[50ch] text-muted-foreground">{site.labsBlurb.text}</p>
              <Button variant="secondary" className="mt-6" asChild>
                <Link to="/labs">See all {plural(counts.labs, 'lab')}</Link>
              </Button>
            </div>
            <ul className="flex flex-col gap-3">
              {featuredLabs.map((lab, i) => (
                <Reveal as="li" index={i} key={lab.id}>
                  <Link
                    to={`/labs/${lab.id}`}
                    className="card-lift flex min-h-16 items-center justify-between gap-4 rounded-panel border border-border bg-card px-5 py-4 hover:border-foreground"
                  >
                    <span className="flex items-center gap-3">
                      <FlaskConical aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-link" />
                      <span className="font-medium">{lab.title}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <LabServiceIcons services={lab.services} size="sm" />
                      <span className="text-sm text-muted-foreground">{plural(lab.steps.length, 'step')}</span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <section aria-labelledby="how-heading" className="border-t border-border py-16 md:py-24">
        <Container>
          <h2 id="how-heading" className="text-[22px] md:text-[28px]">
            How the course works
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" index={i} key={title} className="border-t-2 border-progress pt-5">
                <Icon aria-hidden="true" strokeWidth={1.75} className="size-6 text-primary" />
                <h3 className="mt-3 text-lg">{title}</h3>
                <p className="mt-2 text-muted-foreground">{text}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="learning-hub-heading" className="border-t border-border py-16 md:py-24">
        <Container>
          <LearningHub hub={home.hub} headingId="learning-hub-heading" />
        </Container>
      </section>

      <section aria-labelledby="instructor-heading" className="border-t border-border bg-card py-16 md:py-20">
        <Container className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-3xl font-semibold text-primary-foreground"
          >
            {data.course.instructor.charAt(0)}
          </span>
          <div>
            <h2 id="instructor-heading" className="text-[22px] md:text-[28px]">
              Your instructor
            </h2>
            <p className="mt-2 font-semibold">
              {data.course.instructor}, {data.course.instructorOrg}
            </p>
            <p className="mt-1 max-w-[60ch] text-muted-foreground">{site.instructorBio}</p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="cta-heading" className="bg-volt py-16 text-ink">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 id="cta-heading" className="text-[30px] leading-[1.05] md:text-[44px]">
              Ready when you are
            </h2>
            <p className="mt-2 max-w-[52ch] text-lg">
              {plural(counts.episodes, 'episode')}, {plural(counts.labs, 'lab')} and a certificate at the end.
            </p>
            {home.closingCommand ? (
              <div className="mt-6">
                <CopyCommand label={home.closingCommand.label} code={home.closingCommand.code} />
              </div>
            ) : null}
          </div>
          <Button size="lg" asChild>
            <Link to={startHref}>
              {startLabel}
              <ArrowRight aria-hidden="true" strokeWidth={1.75} />
            </Link>
          </Button>
        </Container>
      </section>
    </>
  )
}
