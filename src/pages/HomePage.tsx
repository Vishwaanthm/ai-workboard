import { ArrowRight, Award, BookOpen, FlaskConical, ListChecks } from 'lucide-react'
import { Link } from 'react-router'
import { HubArt } from '@/components/art/HubArt'
import { LabServiceIcons } from '@/components/art/LabServiceIcons'
import { BackgroundVideo } from '@/components/media/BackgroundVideo'
import { HERO_MEDIA, PART_COVERS } from '@/components/media/partCovers'
import { SectionBackdrop } from '@/components/art/SectionBackdrop'
import { Container } from '@/components/misc'
import { Reveal } from '@/components/motion/Reveal'
import { PageHeading } from '@/components/PageHeading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { courseCounts, episodesInPart } from '@/data'
import { site } from '@/data/site'
import { useAppState } from '@/context/useAppState'
import { nextStep, nextStepHref } from '@/lib/progress'
import { cn, plural } from '@/lib/utils'
import { totalDurationLabel } from '@/lib/watch'

/** Asymmetric 6-column bento for the parts: 4+2, then 2+2+2. */
const CARD_SPANS = ['md:col-span-4', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-3']

const howItWorks = [
  { icon: BookOpen, title: 'Learn', text: 'Watch each short video episode; it is marked complete once you have seen most of it.' },
  { icon: FlaskConical, title: 'Practice', text: 'Work through guided labs and tick off each step as you go.' },
  { icon: ListChecks, title: 'Check', text: 'Pass a short quiz at the end of each part, then the final assessment.' },
  { icon: Award, title: 'Certify', text: 'Print a certificate of completion with your name, date and ID.' },
]

export default function HomePage() {
  const { data, user, progress } = useAppState()
  const counts = courseCounts(data)
  const startHref = user ? nextStepHref(nextStep(progress, data)) : '/register'
  const startLabel = user ? 'Continue the course' : 'Start the course'
  const featuredLabs = data.labs.slice(0, 5)

  return (
    <>
      <section className="on-ink relative isolate flex min-h-[88dvh] items-end overflow-hidden bg-ink pt-28 pb-14 md:items-center md:pb-20">
        <BackgroundVideo {...HERO_MEDIA} className="-z-10" />
        {/* Scrim: keeps every line of hero text at or above 4.5:1 over the brightest video frame. */}
        <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0 -z-10" />
        <Container className="relative">
          <div className="hero-rise max-w-[46rem]">
            <p className="text-sm font-semibold tracking-[0.14em] text-volt uppercase">A course by {data.course.instructorOrg}</p>
            <PageHeading
              title={data.course.title}
              className="mt-5 text-[44px] leading-[0.98] font-extrabold md:text-[68px] xl:text-[80px]"
            >
              {data.course.title}
            </PageHeading>
            <p className="mt-6 max-w-[40ch] text-lg text-on-ink-muted md:text-xl">{site.hero.title}</p>
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
              {plural(counts.parts, 'part')}, {plural(counts.episodes, 'episode')}
            </h2>
            <p className="max-w-[56ch] text-lg text-muted-foreground">{data.course.summary}</p>
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-6">
            {data.parts.map((part, i) => {
              const cover = PART_COVERS[part.theme ?? 'midnight']
              const eps = episodesInPart(data, part.id)
              return (
                <Reveal
                  as="li"
                  index={i}
                  key={part.id}
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
                    className="part-cover absolute inset-0 -z-10 size-full object-cover"
                  />
                  <div aria-hidden="true" className="part-scrim absolute inset-0 -z-10" />
                  <Link to={`/course#part-${part.id}`} className="on-ink flex h-full min-h-72 flex-col justify-between gap-8 p-6 md:p-7">
                    <span className="flex items-center gap-3 text-sm font-semibold text-on-ink">
                      <span aria-hidden="true" className={cn('h-1 w-8 rounded-full', cover.accent)} />
                      Part {part.id}
                      {part.optional ? <Badge tone="outline">Optional</Badge> : null}
                    </span>
                    <span>
                      <h3 className="font-display text-[28px] leading-[1.05] font-bold tracking-[-0.02em] md:text-[34px]">
                        {part.title}
                      </h3>
                      <span className="mt-3 block max-w-[48ch] text-on-ink-muted">{part.outcome}</span>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-on-ink">
                        {plural(eps.length, 'episode')}, {totalDurationLabel(eps)}
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

      <section aria-labelledby="hub-heading" className="on-ink relative overflow-hidden bg-ink py-16 md:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <h2 id="hub-heading" className="text-[34px] leading-[1.02] md:text-[48px]">
              One API in front of many models
            </h2>
            <p className="mt-5 max-w-[46ch] text-lg text-on-ink-muted">
              Amazon Bedrock puts models from many providers behind a single AWS service, in your own Region.
            </p>
          </Reveal>
          <Reveal index={1}>
            <HubArt className="mx-auto max-w-[560px] overflow-hidden rounded-panel shadow-lift" />
          </Reveal>
        </Container>
      </section>

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
                    className="flex min-h-16 items-center justify-between gap-4 rounded-panel border border-border bg-background px-5 py-4 transition-colors duration-[120ms] hover:border-primary"
                  >
                    <span className="flex items-center gap-3">
                      <FlaskConical aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-primary" />
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

      <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden border-t border-border bg-primary-soft py-16">
        <SectionBackdrop variant="grid" />
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 id="cta-heading" className="text-[22px] md:text-[28px]">
              Ready when you are
            </h2>
            <p className="mt-2 text-muted-foreground">
              {plural(counts.episodes, 'episode')}, {plural(counts.labs, 'lab')} and a certificate at the end.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to={startHref}>{startLabel}</Link>
          </Button>
        </Container>
      </section>
    </>
  )
}
