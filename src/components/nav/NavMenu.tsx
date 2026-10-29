import { ArrowRight, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { coverFor } from '@/components/media/partCovers'
import { home } from '@/data/home'
import type { CourseData, HomeSections } from '@/data/types'
import { cn, plural } from '@/lib/utils'

export interface NavMenuItem {
  to: string
  title: string
  description?: string
  /** Small mono label above the title, such as "Part 2". */
  eyebrow?: string
  /** Decorative accent bar class (part theme); always shown next to the eyebrow text. */
  accent?: string
  /** Set on the overview item: rendered as the large lead tile of a wide menu. */
  lead?: boolean
  /** Small mono line at the bottom of the lead tile. */
  footnote?: string
}

export interface NavMenuGroup {
  id: 'course' | 'learn'
  label: string
  items: NavMenuItem[]
  /** Full container width panel (mega menu) instead of a dropdown under the trigger. */
  wide?: boolean
  isActive: (pathname: string) => boolean
}

/**
 * The header menus. Part names and outcomes come from course data and the Learn descriptions from
 * home.ts (learnMenu); the routes themselves stay here.
 */
export function navMenuGroups(data: CourseData, learn: HomeSections['learnMenu'] = home.learnMenu): NavMenuGroup[] {
  return [
    {
      id: 'course',
      label: 'Course',
      wide: true,
      isActive: (p) => p.startsWith('/course') || p.startsWith('/learn'),
      items: [
        {
          to: '/course',
          title: 'Course overview',
          description: data.course.summary,
          lead: true,
          footnote: [
            data.course.level,
            plural(data.parts.length, 'part'),
            plural(data.episodes.length, 'episode'),
          ].join(', '),
        },
        ...data.parts.map((part) => ({
          to: `/course#part-${part.id}`,
          eyebrow: `Part ${part.id}`,
          title: part.title,
          description: part.outcome,
          accent: coverFor(part).accent,
        })),
      ],
    },
    {
      id: 'learn',
      label: 'Learn',
      isActive: (p) => p.startsWith('/certificate') || p.startsWith('/quiz'),
      items: [
        { to: '/labs', title: 'Labs', description: learn.labs },
        { to: '/dashboard', title: 'Dashboard', description: learn.dashboard },
        { to: '/certificate', title: 'Certificate', description: learn.certificate },
      ],
    },
  ]
}

function menuLinks(panel: HTMLElement | null): HTMLAnchorElement[] {
  return panel ? Array.from(panel.querySelectorAll<HTMLAnchorElement>('a[href]')) : []
}

/**
 * Desktop disclosure menu on the ink header (WAI-ARIA disclosure navigation pattern, not role="menu"):
 * the trigger is a button with aria-expanded/aria-controls and the panel is a list of plain links that
 * follows it in the tab order. Escape closes and returns focus to the trigger; a pointer press outside
 * or focus moving elsewhere closes it; ArrowDown on the trigger opens and focuses the first link;
 * ArrowUp/ArrowDown move between links. Only one menu is open at a time (state lives in the header).
 */
export function DesktopNavMenu({
  group,
  pathname,
  open,
  onOpenChange,
}: {
  group: NavMenuGroup
  pathname: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const panelId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const focusFirstOnOpen = useRef(false)
  const active = group.isActive(pathname)

  useEffect(() => {
    if (!open) return
    if (focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false
      menuLinks(panelRef.current)[0]?.focus()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      const wrap = wrapRef.current
      const inside = !!wrap && wrap.contains(document.activeElement)
      if (e.key === 'Escape') {
        onOpenChange(false)
        if (inside) triggerRef.current?.focus()
        return
      }
      if (!inside || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return
      const links = menuLinks(panelRef.current)
      if (links.length === 0) return
      const i = links.indexOf(document.activeElement as HTMLAnchorElement)
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? (i + 1) % links.length : i <= 0 ? links.length - 1 : i - 1
      links[next]?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, onOpenChange])

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown') return
    e.preventDefault()
    if (open) {
      menuLinks(panelRef.current)[0]?.focus()
    } else {
      focusFirstOnOpen.current = true
      onOpenChange(true)
    }
  }

  return (
    <div
      ref={wrapRef}
      className={group.wide ? undefined : 'relative'}
      onBlur={(e) => {
        if (!open) return
        const next = e.relatedTarget as Node | null
        if (next) {
          if (!e.currentTarget.contains(next)) onOpenChange(false)
          return
        }
        // No new target: either a press on a non-focusable spot (the pointer handler decides) or the
        // window itself lost focus, which also closes the menu.
        window.setTimeout(() => {
          if (!document.hasFocus()) onOpenChange(false)
        }, 0)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-control px-3 font-medium underline-offset-8 transition-colors duration-[120ms]',
          open || active ? 'text-on-ink' : 'text-on-ink-muted hover:bg-on-ink/10 hover:text-on-ink',
          active && 'underline decoration-volt decoration-2',
          open && 'bg-on-ink/10',
        )}
      >
        {group.label}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className={cn(
            'menu-panel absolute z-40 mt-2 rounded-panel border border-ink-line bg-ink-raised p-2 shadow-lift',
            group.wide ? 'inset-x-4 top-full sm:inset-x-6 lg:inset-x-8' : 'top-full left-0 w-80',
          )}
        >
          <ul className={cn('grid gap-1', group.wide && 'md:grid-cols-3')}>
            {group.items.map((item) => (
              <li key={item.to} className={cn(item.lead && group.wide && 'md:row-span-3')}>
                <Link
                  to={item.to}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'group/item flex h-full min-h-11 flex-col rounded-control p-3 transition-colors duration-[120ms] hover:bg-on-ink/10',
                    item.lead && 'justify-between gap-6 border border-ink-line bg-ink p-4',
                  )}
                >
                  {item.eyebrow ? (
                    <span className="flex items-center gap-2 font-mono text-sm text-on-ink-muted">
                      {item.accent ? (
                        <span aria-hidden="true" className={cn('h-1 w-6 rounded-full', item.accent)} />
                      ) : null}
                      {item.eyebrow}
                    </span>
                  ) : null}
                  <span>
                    <span
                      className={cn(
                        'flex items-center gap-2 font-display font-bold text-on-ink',
                        item.lead ? 'text-xl' : 'mt-1 text-base',
                      )}
                    >
                      {item.title}
                      <ArrowRight
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="size-4 text-volt transition-transform duration-[120ms] group-hover/item:translate-x-0.5"
                      />
                    </span>
                    {item.description ? (
                      <span className={cn('mt-1 text-sm text-on-ink-muted', item.lead ? 'block' : 'line-clamp-3')}>
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {item.footnote ? <span className="font-mono text-sm text-volt">{item.footnote}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/** The same groups inside the paper mobile sheet, as disclosure buttons with plain link lists. */
export function SheetNavGroup({
  group,
  open,
  onOpenChange,
  onNavigate,
}: {
  group: NavMenuGroup
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: () => void
}) {
  const listId = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => onOpenChange(!open)}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-between rounded-control px-3 font-medium text-foreground transition-colors duration-[120ms] hover:bg-muted"
      >
        {group.label}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <ul id={listId} className="mt-1 mb-2 ml-3 flex flex-col gap-1 border-l border-border pl-2">
          {group.items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                className="flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-foreground transition-colors duration-[120ms] hover:bg-muted"
              >
                {item.accent ? (
                  <span aria-hidden="true" className={cn('h-1 w-4 shrink-0 rounded-full', item.accent)} />
                ) : null}
                <span>
                  {item.eyebrow ? (
                    <span className="font-mono text-sm text-muted-foreground">{item.eyebrow}: </span>
                  ) : null}
                  {item.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
