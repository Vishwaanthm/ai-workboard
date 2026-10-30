import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ANNOUNCEMENT_KEY, AnnouncementBar } from '@/components/AnnouncementBar'
import { CopyCommand } from '@/components/home/CopyCommand'
import { SmartLink } from '@/components/SmartLink'
import { ModelStrip } from '@/components/home/ModelStrip'
import { courseData } from '@/data'
import { home } from '@/data/home'
import { dateOrTba } from '@/lib/useCopy'
import { renderApp } from './helpers'

const originalMatchMedia = window.matchMedia

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

const PROVIDERS = home.models.providers

describe('announcement bar', () => {
  const announcement = {
    id: 'a-1',
    text: 'Announcement text goes here.',
    link: { label: 'Announcement link', href: '/course' },
  }

  it('shows the announcement with its link and remembers a dismissal', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <MemoryRouter>
        <AnnouncementBar announcement={announcement} />
      </MemoryRouter>,
    )
    const bar = screen.getByRole('region', { name: 'Announcement' })
    expect(within(bar).getByText('Announcement text goes here.')).toBeInTheDocument()
    expect(within(bar).getByRole('link', { name: /Announcement link/ })).toHaveAttribute('href', '/course')

    await user.click(within(bar).getByRole('button', { name: 'Dismiss announcement' }))
    expect(screen.queryByRole('region', { name: 'Announcement' })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(ANNOUNCEMENT_KEY)).toBe('a-1')
    unmount()

    // Still hidden after a reload; a new announcement id shows again.
    const again = render(
      <MemoryRouter>
        <AnnouncementBar announcement={announcement} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('region', { name: 'Announcement' })).not.toBeInTheDocument()
    again.unmount()
    render(
      <MemoryRouter>
        <AnnouncementBar announcement={{ ...announcement, id: 'a-2' }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('region', { name: 'Announcement' })).toBeInTheDocument()
  })

  it('renders nothing when there is no announcement', () => {
    const { container } = render(
      <MemoryRouter>
        <AnnouncementBar announcement={null} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('sits above the header on every page', async () => {
    renderApp('/labs')
    await screen.findByRole('heading', { level: 1 })
    const bar = screen.getByRole('region', { name: 'Announcement' })
    const header = screen.getByRole('banner')
    expect(bar.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('header mega-menu', () => {
  it('opens the Course menu with the overview and every episode, and Escape closes it and restores focus', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    const trigger = screen.getByRole('button', { name: 'Course' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!
    expect(panel).toBeInTheDocument()
    const links = within(panel).getAllByRole('link')
    expect(links).toHaveLength(courseData.episodes.length + 1)
    expect(links[0]).toHaveAttribute('href', '/course')
    courseData.episodes.forEach((episode, i) => {
      expect(links[i + 1]).toHaveAttribute('href', `/course#episode-${episode.id}`)
      expect(links[i + 1]).toHaveAccessibleName(expect.stringContaining(episode.title))
      expect(links[i + 1]).toHaveAccessibleName(expect.stringContaining(episode.summary))
    })

    // The panel follows its trigger in the tab order.
    await user.tab()
    expect(links[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(links[1]).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('ArrowDown on a trigger opens it and focuses the first link; only one menu is open at a time', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    const course = screen.getByRole('button', { name: 'Course' })
    const learn = screen.getByRole('button', { name: 'Learn' })

    course.focus()
    await user.keyboard('{ArrowDown}')
    expect(course).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /Course overview/ })).toHaveFocus()

    await user.click(learn)
    expect(learn).toHaveAttribute('aria-expanded', 'true')
    expect(course).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(learn.getAttribute('aria-controls')!)!
    expect(
      within(panel)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/labs', '/dashboard', '/certificate'])
    // Descriptions come from home.ts, not the component.
    expect(within(panel).getByRole('link', { name: /Labs/ })).toHaveAccessibleName(
      expect.stringContaining(home.learnMenu.labs),
    )

    // A press outside closes it.
    await user.click(screen.getByRole('heading', { level: 1 }))
    expect(learn).toHaveAttribute('aria-expanded', 'false')
  })

  it('following an episode link navigates to the Course page and opens that episode', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/course')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    const ep3 = document.getElementById('episode-3')!
    const ep3Trigger = within(ep3).getAllByRole('button')[0]!
    expect(ep3Trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Course' }))
    await user.click(screen.getByRole('link', { name: /^E03/ }))
    expect(router.state.location.hash).toBe('#episode-3')
    await waitFor(() => expect(ep3Trigger).toHaveAttribute('aria-expanded', 'true'))
    // The episode opened before (E01, the default) stays open.
    expect(within(document.getElementById('episode-1')!).getAllByRole('button')[0]).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('offers the same groups inside the mobile menu', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const sheet = await screen.findByRole('dialog')
    const group = within(sheet).getByRole('button', { name: 'Course' })
    expect(group).toHaveAttribute('aria-expanded', 'false')
    await user.click(group)
    expect(group).toHaveAttribute('aria-expanded', 'true')
    expect(within(sheet).getByRole('link', { name: 'Course overview' })).toHaveAttribute('href', '/course')
    expect(within(sheet).getByRole('link', { name: /E05/ })).toHaveAttribute('href', '/course#episode-5')
    // Existing links are still there.
    expect(within(sheet).getByRole('link', { name: 'Labs' })).toHaveAttribute('href', '/labs')
  })
})

describe('explore by episode tabs', () => {
  it('uses a roving tabindex and moves with the arrow, Home and End keys', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    const tablist = screen.getByRole('tablist', { name: 'Course episodes' })
    const tabs = within(tablist).getAllByRole('tab')
    expect(tabs).toHaveLength(courseData.episodes.length)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1'])

    tabs[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(tabs[1]).toHaveFocus()
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('tabindex', '-1')
    expect(tabs[1]).toHaveAttribute('tabindex', '0')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', tabs[1]!.id)
    const episode = courseData.episodes[1]!
    expect(within(panel).getByRole('heading', { level: 3, name: episode.title })).toBeInTheDocument()
    expect(within(panel).getByText(episode.summary)).toBeInTheDocument()
    for (const outcome of episode.outcomes) expect(within(panel).getByText(outcome)).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: 'Go to E02' })).toHaveAttribute('href', '/course#episode-2')
    expect(within(panel).getByRole('button', { name: /^Copy: / })).toBeInTheDocument()

    await user.keyboard('{End}')
    expect(tabs[4]).toHaveFocus()
    expect(tabs[4]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowRight}')
    expect(tabs[0]).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(tabs[4]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(tabs[0]).toHaveFocus()
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    // Only the selected panel is shown.
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })
})

describe('model provider strip', () => {
  it('scrolls with a hidden duplicate track when motion is allowed', () => {
    mockReducedMotion(false)
    render(<ModelStrip providers={PROVIDERS} />)
    const strip = screen.getByTestId('model-strip')
    expect(strip).toHaveAttribute('data-moving', 'true')
    expect(strip).toHaveAttribute('tabindex', '0')
    const lists = strip.querySelectorAll('ul')
    expect(lists).toHaveLength(2)
    expect(lists[1]).toHaveAttribute('aria-hidden', 'true')
    // Screen readers get each name once.
    expect(within(screen.getByRole('list', { name: 'Model providers' })).getAllByRole('listitem')).toHaveLength(
      PROVIDERS.length,
    )
  })

  it('is a static wrapped list under reduced motion', () => {
    mockReducedMotion(true)
    render(<ModelStrip providers={PROVIDERS} />)
    const strip = screen.getByTestId('model-strip')
    expect(strip).toHaveAttribute('data-moving', 'false')
    expect(strip.tagName).toBe('UL')
    expect(strip.querySelector('.marquee-track')).toBeNull()
    expect(screen.getAllByRole('listitem')).toHaveLength(PROVIDERS.length)
  })

  it('shows brand marks only where a file exists, with the name always written', () => {
    mockReducedMotion(true)
    render(<ModelStrip providers={PROVIDERS} />)
    const items = screen.getAllByRole('listitem')
    PROVIDERS.forEach((p, i) => {
      expect(items[i]).toHaveTextContent(p.name)
      const mark = items[i]!.querySelector('[data-mark]')
      if (p.mark) {
        expect(mark).toHaveAttribute('aria-hidden', 'true')
        expect(mark).toHaveAttribute('data-mark', p.mark)
      } else expect(mark).toBeNull()
      for (const model of p.models ?? []) expect(items[i]).toHaveTextContent(model)
    })
  })

  it('is static when the footer Background motion switch is off', () => {
    mockReducedMotion(false)
    window.localStorage.setItem('aiw.backgroundVideo', 'off')
    render(<ModelStrip providers={PROVIDERS} />)
    expect(screen.getByTestId('model-strip')).toHaveAttribute('data-moving', 'false')
  })
})

describe('home placeholders', () => {
  it('only emits in-app paths and http(s) URLs as links', () => {
    render(
      <MemoryRouter>
        <SmartLink href="/course#episode-2">In app</SmartLink>
        <SmartLink href="https://example.com/post">Other site</SmartLink>
        <SmartLink href="javascript:alert(1)">Unsafe</SmartLink>
        <SmartLink href="data:text/html,hi">Data URL</SmartLink>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'In app' })).toHaveAttribute('href', '/course#episode-2')
    const external = screen.getByRole('link', { name: /Other site/ })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: 'Unsafe' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Data URL' })).not.toBeInTheDocument()
    expect(screen.getByText('Unsafe')).toBeInTheDocument()
  })

  it('copies the closing command', async () => {
    const user = userEvent.setup()
    render(<CopyCommand label="Command" code="command goes here" />)
    await user.click(screen.getByRole('button', { name: 'Copy: Command' }))
    expect(await navigator.clipboard.readText()).toBe('command goes here')
    expect(screen.getByRole('button', { name: 'Copied: Command' })).toBeInTheDocument()
  })

  it('shows TBA for missing or invalid dates', () => {
    expect(dateOrTba(undefined)).toBe('TBA')
    expect(dateOrTba('soon')).toBe('TBA')
    expect(dateOrTba('2026-02-31')).toBe('TBA')
    expect(dateOrTba('2026-11-30')).toBe('30 Nov 2026')
  })

  it('shows the catalog analogy and one journey step per episode, linked to its lesson', async () => {
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    const analogy = screen.getByRole('region', { name: home.analogy.title })
    expect(within(analogy).getByText(home.analogy.quote)).toBeInTheDocument()
    for (const item of home.analogy.items) expect(within(analogy).getByText(item.title)).toBeInTheDocument()
    const journey = screen.getByRole('region', { name: home.journey.title })
    const steps = within(journey).getAllByRole('listitem')
    expect(steps).toHaveLength(courseData.episodes.length)
    home.journey.steps.forEach((step, i) => {
      const link = within(steps[i]!).getByRole('link')
      expect(link).toHaveAttribute('href', `/learn/${step.episodeId}`)
      expect(link).toHaveTextContent(step.text)
    })
  })

  it('renders every new home section without a testimonial', async () => {
    renderApp('/')
    await screen.findByRole('heading', { level: 1, name: courseData.course.title })
    for (const name of [
      'Bedrock is a restaurant',
      'Models on Amazon Bedrock',
      'Explore by episode',
      "Priya's dinner-idea app",
      'Learning hub',
      'Ready when you are',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    expect(screen.getAllByText('TBA').length).toBeGreaterThan(0)
    expect(document.querySelector('blockquote')).toBeNull()
  })
})
