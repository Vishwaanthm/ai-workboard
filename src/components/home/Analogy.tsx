import { BookOpenText, ChefHat, CookingPot, DoorOpen, Receipt, ShieldCheck, type LucideIcon } from 'lucide-react'
import { ANALOGY_IMAGE } from '@/components/media/covers'
import { Reveal } from '@/components/motion/Reveal'
import type { AnalogyIcon, HomeSections } from '@/data/types'

const ICONS: Record<AnalogyIcon, LucideIcon> = {
  door: DoorOpen,
  menu: BookOpenText,
  chef: ChefHat,
  dish: Receipt,
  manager: ShieldCheck,
  kitchen: CookingPot,
}

/**
 * The course's running analogy on ink (catalog words from home.ts): a working kitchen photo in a framed
 * window and, beside it, the whole analogy sentence and one row per element with a lucide icon. Rows
 * without a catalog meaning show the title alone (nothing is invented to fill them).
 */
export function Analogy({ analogy, headingId }: { analogy: HomeSections['analogy']; headingId: string }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      <Reveal className="relative order-last overflow-hidden rounded-panel border border-ink-line shadow-lift lg:order-first">
        <img
          src={ANALOGY_IMAGE.src}
          srcSet={ANALOGY_IMAGE.srcSet}
          sizes="(min-width: 1024px) 45vw, 100vw"
          alt="A restaurant kitchen during service, a chef working at the pass"
          loading="lazy"
          decoding="async"
          width={1280}
          height={853}
          className="aspect-[4/3] w-full object-cover"
        />
      </Reveal>
      <div className="min-w-0">
        <Reveal>
          <p className="font-mono text-sm font-semibold text-volt">The running analogy</p>
          <h2 id={headingId} className="mt-3 text-[34px] leading-[1.02] md:text-[48px]">
            {analogy.title}
          </h2>
          <p className="mt-5 max-w-[56ch] text-lg text-on-ink-muted">{analogy.quote}</p>
        </Reveal>
        <ul className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {analogy.items.map((item, i) => {
            const Icon = ICONS[item.icon]
            return (
              <Reveal as="li" index={i} key={item.id} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-ink-line bg-ink-raised">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-5 text-volt" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold tracking-[-0.01em] text-on-ink">{item.title}</span>
                  {item.meaning ? <span className="block text-on-ink-muted">{item.meaning}</span> : null}
                </span>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
