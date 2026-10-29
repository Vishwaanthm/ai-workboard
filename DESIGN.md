# AI Workboard (AWS) - Design System: "Ink and Volt"

Locked 2026-10-29 (replaces the 2026-10-28 teal "Developer Mono" system). Source of truth for every
colour, font, radius, shadow and motion value. Tokens live in `src/index.css` (`@theme`); components use
tokens only. Anything not listed here is not allowed in components.

## Direction

Cinematic ink surfaces with real imagery (stock video and photos) for every page header, paper reading
surfaces for learning content, and one electric volt-lime signal colour. Each course part carries a
catalog accent and a cover photo. Bold display type, a calm text face, a mono for labels and code.

- Design read: video course platform (marketing home plus learning app) for AWS beginners; creative,
  bold, premium, professional.
- Dials: DESIGN_VARIANCE 6 (asymmetric bento on Home, split auth layout, overlapping enrol card),
  MOTION_INTENSITY 6 on Home (interactive hero) and 4 elsewhere, VISUAL_DENSITY 5 (Dashboard 6).
- Layers: UI/UX Pro Max (`ux` rules, "Immersive/Interactive" landing pattern: pause off-screen, mobile
  fallback, reduced-motion final state), Taste `output-skill`, Design Motion Principles (Create mode).
- Precedence: accessibility, then the user's brief, then this file, then taste rules.

## Colour tokens

Measured contrast (WCAG 2.x relative luminance, computed from the hex values).

### Paper (reading surfaces)

| Token | Hex | Role | Measured contrast |
| --- | --- | --- | --- |
| `background` | `#F5F5F0` | Page canvas (paper) | - |
| `foreground` | `#0D1222` | Headings, body text | 17.04 on background, 18.64 on card, 15.53 on muted |
| `card` | `#FFFFFF` | Cards, panels, inputs | - |
| `muted` | `#EAEBE4` | Table header, subtle fills, progress track | - |
| `muted-foreground` | `#4A5163` | Secondary text, meta | 7.25 on background, 7.93 on card, 6.61 on muted |
| `primary` | `#0D1222` | Primary buttons (ink), active nav, focus ring on paper | white on it 18.64 |
| `primary-hover` | `#2A3150` | Primary button hover; text on `primary-soft` | 11.33 on primary-soft |
| `primary-soft` | `#ECF7CC` | Lime tint: selected/complete fills, info callouts | - |
| `link` | `#3F6212` | Text links on paper (always underlined) | 6.47 on background, 7.08 on card, 5.90 on muted, 6.32 on primary-soft |
| `link-hover` | `#0D1222` | Link hover (plus 2px underline) | 17.04 on background |
| `progress` | `#4D7C0F` | Progress fills, completed check icons (non-text) | 4.16 on muted (3:1 UI ok) |
| `input` | `#6B7080` | Input, checkbox, radio boundaries | 4.94 on card |
| `border` | `#D9DACF` | Decorative card edges (never the only boundary of a control) | - |
| `accent-soft` / `accent-soft-foreground` | `#FEF3C7` / `#92400E` | Caution callouts ("Untested") | 6.37 |
| `destructive-soft` / `destructive-soft-foreground` | `#FEF2F2` / `#B91C1C` | Errors | 5.91 |

### Ink (cinematic surfaces)

| Token | Hex | Role | Measured contrast |
| --- | --- | --- | --- |
| `ink` | `#0B0F1C` | Header, footer, page bands, lesson theater, hero | - |
| `ink-raised` | `#151B2E` | Cards inside ink bands | - |
| `ink-line` | `#2A3350` | Borders on ink | - |
| `on-ink` | `#F5F5F0` | Text on ink | 17.47 on ink, 15.64 on ink-raised |
| `on-ink-muted` | `#B4BBCF` | Secondary text on ink | 9.96 on ink, 8.92 on ink-raised, 7.87 on `#1D2540` |
| `volt` | `#C5F04A` | The one signal colour: CTAs, eyebrows, links and focus ring on ink, progress on ink | 14.50 on ink, 12.98 on ink-raised; ink text on volt 14.50 |
| `volt-hover` | `#D8F985` | Volt button hover, badge text in ink scope | 11.68 on `#26301F` |

Volt is never used as text on paper (1.3:1 on white). On paper the volt role is taken by `link`
(lime-800) for text and by volt only as a non-text stripe (enrol card, certificate, CTA band background
with ink text).

### Part accents (catalog themes)

`theme-ocean #38BDF8`, `theme-midnight #A5B4FC`, `theme-sunrise #FB923C`, `theme-slate #CBD5E1`,
`theme-forest #4ADE80`, `theme-aurora #5EEAD4`. Decorative only (accent bars, spine segments, cover
underlines), never text and never the only signal: the part number and title are always written next
to them. Part 1 to 5 use ocean, midnight, sunrise, slate, forest; aurora (E12's theme) is unused.

### Ink scope

`.ink-scope` (with `.on-ink`) re-maps the paper tokens inside an ink band so any component renders in
its on-ink form without variants: `foreground #F5F5F0`, `card #151B2E`, `muted #1D2540`,
`muted-foreground #B4BBCF`, `primary #C5F04A` (button text ink), `primary-soft #26301F`,
`progress #C5F04A`, `border #2A3350`, `input #8A93AB` (5.57 on ink-raised), `link #C5F04A`,
`ring #C5F04A`, `color-scheme: dark` (native selects). Used by `PageBand`, the lesson theater, the
Course instructor panel, the Dashboard certificate panel and the auth image panel.

### Code

`code #0F172A`, `code-foreground #F8FAFC` (17.06), `code-muted #94A3B8` (6.96), `code-accent #22C55E`
(7.83), `code-highlight #5EEAD4` (12.07). Code blocks are inset components on paper pages.

## Links (WCAG 1.4.1, 1.4.3)

- `.link`: `link` colour, weight 600, 1px underline at 4px offset; hover: `link-hover` colour and a 2px
  underline. Inside the ink scope the same class is volt on ink. Links are never told apart by colour
  alone: the underline is always present.
- Brand mark: "AI Workboard" plus a mono "(AWS)" label in volt on ink (header, footer) and `link`
  colour on paper.
- Header nav (on ink): current page in `on-ink` with a 2px volt underline; others `on-ink-muted`,
  hover `on-ink` on a 10% paper tint. Mobile sheet (paper): current page underlined in `link`.
- Card links (lab, quiz, episode cards) are whole-card links with a visible title, an arrow that moves
  1 step on hover and a border change; they are not inline text.

## Typography

| Role | Font | Size (mobile / desktop) | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Hero display (Home h1) | Bricolage Grotesque | 44 / 68 / 80px | 800 | -0.03em |
| Band title (page h1) | Bricolage Grotesque | 32 / 48px (lg bands 38 / 60px) | 800 | -0.03em |
| Section (h2) | Bricolage Grotesque | 26-30 / 32-40px | 700 | -0.02em |
| Card title | Bricolage Grotesque | 18-20px | 700 | -0.01em |
| Body | Instrument Sans | 16px (lede 18-20px) | 400 | 0 |
| Meta, eyebrows, episode codes, durations | Geist Mono | 12-14px | 400-600 | 0 |

Self-hosted via `@fontsource-variable/*`. Body min 16px, meta min 14px (12px only for the course
spine part labels and the lesson sidebar codes, which repeat visible information). Reading width
max 68ch. No em or en dashes in visible strings. Eyebrows: Home hero uses one uppercase tracked line;
page bands use a mono eyebrow with the part accent bar.

## Imagery and page bands

- Every page opens with an ink band (`src/components/PageBand.tsx`): cover photo, `band-scrim`, mono
  eyebrow with accent bar, h1, lede, free slot; optional framed cover window on large screens.
  Course, Dashboard, Certificate and 404 use the hero poster frame; Labs uses the Building cover; Lab and
  Quiz use their part's cover. The lesson page uses an ink "theater" around the player with the part
  cover at 40% under the same scrim. Login and Register use a split layout (`AuthShell`).
- Part covers (Pixabay, CREDITS.md): 640 and 1280 WebP, `srcset`, lazy except in bands.
- Scrims (worst case = text over a pure-white image pixel; the hero video does contain white pixels):

| Surface | Scrim (ink alpha in the text zone) | on-ink | on-ink-muted | volt |
| --- | --- | --- | --- | --- |
| Home hero, desktop (copy within 48% of width) | >= 0.80 | 9.60 | 5.48 | 7.97 |
| Home hero, mobile (copy in the lower 60%) | >= 0.84 | 11.17 | 6.37 | 9.27 |
| Page band, any width (min 0.78 at the right edge) | >= 0.78 | 8.88 | 5.07 | 7.37 |
| Page band, below 768px (flat) | 0.88 | 12.75 | 7.27 | 10.58 |
| Video placeholder | 0.86 | 11.88 | 6.78 | 9.86 |
| Lesson theater (photo at 40%, then band scrim) | - | 14.12 | 8.05 | 11.72 |

## Interactive hero (Home)

Layers, back to front: background video (`hero-layer-bg`), hero scrim, pointer network canvas
(`HeroNetwork`), copy (`hero-layer-fg`). No pause or play control on the hero (user requirement).

- Network: plain 2D canvas, 24 to 110 nodes (one per 14,000 px2), drifting; faint paper lines
  between nodes closer than 130px. With a fine pointer the nodes within 220px are drawn in (held off
  inside 48px), link to the cursor in volt and a soft volt spotlight (radius 300px) follows it.
- Parallax: the pointer offset (-1..1, eased) moves the video -14/-10px (scaled 1.06 so no edge shows),
  the copy +6/+4px and each node by up to 22/16px times its depth. No tilt (text stays crisp).
- Text safety: the canvas knocks itself out over the copy box (destination-out, feathered 24px), so
  the network keeps about 11% strength behind the text. Hero copy uses `on-ink` and volt only. Worst
  case with a volt line over a white pixel: on-ink 7.69 and volt 6.38 at the 0.80 scrim; the headline
  where it runs past 48% of the width (scrim about 0.69, large text) 5.31.
- Touch / no hover: no pointer tracking; ambient drift plus a 900ms volt ripple that pushes nearby
  nodes on tap. Listeners are passive on the hero section; the canvas has `pointer-events: none`.
- Performance: requestAnimationFrame, frame-rate independent easing, devicePixelRatio capped at 2,
  paused when the hero is off-screen (IntersectionObserver) or the tab is hidden, resized with
  ResizeObserver, no new dependencies.
- Reduced motion: no canvas, no parallax, poster image instead of video. Footer "Background video"
  switch off: poster, one still network frame, no pointer tracking.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Enters, reveals, hovers |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Progress ring fill |
| `--duration-fast` | 120ms | Hover colour, arrow nudge, press `scale(0.98)` |
| `--duration-base` | 200ms | Card lift (-2px plus shadow), accordion, sheet enter |
| `--duration-exit` | 150ms | Sheet/dialog exit |
| `--duration-slow` | 320ms | Progress bar fill |
| `--duration-reveal` | 520ms | Scroll reveal (opacity, 12px rise, 4px blur) |
| `--duration-draw` | 900ms | Hub diagram draw-in (once, no loop) |
| `--duration-ring` | 700ms | Progress ring fill |
| hero rise | 700ms, 80ms stagger | Hero copy entrance |

Looping motion: only the hero background video, the hero network and the Home model provider strip,
all stopped by the footer "Background video" switch (WCAG 2.2.2) and all absent under
`prefers-reduced-motion` (the switch is then hidden because nothing moves). Only `transform`, `opacity`, `filter`, `stroke-dashoffset` and the
canvas animate. The global reduced-motion rule sets every CSS duration to 0.01ms as a backstop.

## Home sections (Strands-style patterns, 2026-10-29)

Section patterns borrowed from strandsagents.com, drawn in this system (no Strands text, logos,
names, images or testimonials). Placeholder copy lives in `src/data/home.ts` (`HomeSections`); part
names, outcomes and episodes always come from `course.ts`.

| Section | Where | Surface and tokens | Motion |
| --- | --- | --- | --- |
| Announcement bar | Above the header, every page (`AnnouncementBar`) | `volt` band, ink text 14.50, ink focus ring; dismiss button 44px | none |
| Course / Learn menus | Header (`nav/NavMenu.tsx`); mobile sheet groups | Panel `ink-raised`, `ink-line` border, `shadow-lift`; part accent bar beside "Part N" | 160ms fade + 4px rise from the trigger |
| Model provider strip | Home, after the hub diagram, ink | Text chips `ink-raised` + volt dot, display 18-20px | 40s linear marquee, pauses on hover/focus; static wrap when reduced or switch off |
| Explore by part | Home, paper | Tabs: selected = ink fill, others card; panel card + `CodeBlock` | panel rise-in (200ms) on change |
| What you'll build | Home, ink | Cards `ink-raised`, volt link line, optional AWS service icon with its name | Reveal + 2px lift |
| Learning hub | Home, paper | Card panel + ink-scope events column; dates "TBA" when missing | Reveal |
| Closing command | Volt CTA band | Ink pill, volt `$`, copy button | none |

Tabs: roving tabindex, Left/Right/Home/End, automatic activation. Menus: disclosure pattern (button
`aria-expanded` + `aria-controls`, plain links), Escape returns focus, outside press or focus leaving
closes, ArrowDown opens and focuses the first link.

## Shape, depth, spacing

- Radius: `--radius-control 6px` (buttons, inputs, badges; checkboxes 4px), `--radius-panel 10px`.
- Shadows: `--shadow-raised` (cards at rest), `--shadow-lift` (hover lift, enrol card, band cards,
  certificate). `.card-lift` = raised plus -2px / lift on hover (no lift under reduced motion).
- Container `max-w-6xl` with `px-4 sm:px-6 lg:px-8`. Bands `py-10 md:py-14` (lg `py-14 md:py-20`),
  content `py-10 md:py-14`.
- Touch targets at least 44px (`min-h-11`); focus ring 2px with 2px offset, ink on paper, volt on ink.

## Print

The certificate prints on one A4 landscape page (`@page size: A4 landscape`, 250mm wide card), with
the header, footer, band and buttons hidden (`no-print`) and the volt top stripe kept
(`print-color-adjust: exact`).

## Iconography and AWS assets

lucide-react, `strokeWidth 1.75`, 16/20/24px; decorative icons `aria-hidden`. Official AWS
Architecture Icons (`public/aws-icons/`) unmodified for services on lab cards and the hub diagram; the
two AWS group colours (`#242F3E`, `#00A4A6`) are allowed only inside the hub diagram frames. No emoji.
