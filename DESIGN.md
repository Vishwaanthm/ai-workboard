# AI Workboard (AWS) - Design System

Locked 2026-10-28. Source of truth for every color, font, radius, shadow and motion value in the app.
Anything not listed here is not allowed in components.

## Provenance

- Generated with UI/UX Pro Max (`search.py --design-system`, dials V4/M3/D5). The first query
  ("online course learning platform...") returned a kids-education profile (Baloo 2 + Comic Neue,
  testimonials pattern) and was rejected as off-audience. The retry ("developer documentation technical
  course") returned "Minimalism & Swiss Style" with the **Developer Mono** font pairing.
- Palette roles come from the database's **LMS (Learning Management System)** palette (education teal +
  course amber). Code surfaces use the database's **Developer Tool / API Developer Portal** dark palette.
- Contrast adjustments (accessibility outranks palette): `#0D9488` fails 4.5:1 for text and white-on-teal
  buttons, so text/button teal is darkened to `#0F766E` (Tailwind teal-700); `#0D9488` is kept for
  non-text fills. Border role `#5EEAD4` (1.48:1 on white) is too loud for every card edge and too faint
  for input boundaries, so it is split into a quiet decorative border and a 3:1 input border.
- Taste layer: `taste-skill` (landing rules on `/`) + `output-skill` (no placeholders) everywhere.
  App screens follow UI/UX Pro Max `ux` rules. lucide-react is used because the user chose it
  (user instruction outranks Taste's icon preference).

## Dials

| Dial | Value | Why |
| --- | --- | --- |
| DESIGN_VARIANCE | 5 | Learning product: clear, mostly left-aligned layouts with one asymmetric hero and a bento on Home |
| MOTION_INTENSITY | Home and Course 6; Dashboard 5; Lesson, Lab, Quiz, Certificate 4; Login and Register 3 | Phase 2 (user request): expressive one-time motion on the marketing pages, calm learning pages |
| VISUAL_DENSITY | 5 | Standard app spacing; Home at 4, Dashboard at 6 |

## Color tokens (light theme only)

All values are CSS variables in `src/index.css` mapped to Tailwind v4 `@theme` colors.
Measured contrast ratios (WCAG 2.x relative luminance) are listed where text or UI sits on the token.

| Token | Hex | Role | Measured contrast |
| --- | --- | --- | --- |
| `--background` | `#F0FDFA` | Page canvas | - |
| `--foreground` | `#134E4A` | Headings, body text | 9.09 on background, 9.48 on card |
| `--card` | `#FFFFFF` | Cards, panels, inputs | - |
| `--muted` | `#E8F1F4` | Subtle fills, table header, skeletons | - |
| `--muted-foreground` | `#475569` | Secondary text, meta | 7.27 on background, 7.58 on card, 6.61 on muted |
| `--primary` | `#0F766E` | Primary buttons, links, focus ring, active nav | white on primary 5.47; primary on background 5.25 |
| `--primary-foreground` | `#FFFFFF` | Text on primary | 5.47 |
| `--primary-hover` | `#115E59` | Primary button hover | white on it 7.58 |
| `--primary-soft` | `#CCFBF1` | Selected/completed tint, info callouts | foreground on it 8.41, primary-hover on it 6.73 |
| `--progress` | `#0D9488` | Progress fills, completed check icons (non-text) | 3.74 on card, 3.27 on muted (3:1 UI ok) |
| `--accent` | `#D97706` | Achievement fills: certificate seal, passed-quiz icon (non-text) | 3.19 on card (3:1 UI ok) |
| `--accent-foreground` | `#B45309` | Amber text on white | 5.02 on card |
| `--accent-soft` | `#FEF3C7` | Amber tint (warnings, "untested" callout) | `#92400E` text on it 6.37 |
| `--accent-soft-foreground` | `#92400E` | Text on accent-soft | 6.37 |
| `--destructive` | `#DC2626` | Error text/icons, destructive button | 4.83 on card |
| `--destructive-soft` | `#FEF2F2` | Error callout fill | `#B91C1C` text on it 5.91 |
| `--destructive-soft-foreground` | `#B91C1C` | Text on destructive-soft | 5.91 |
| `--border` | `#C7E3DE` | Decorative card edges, dividers (never the only boundary of a control) | - |
| `--input` | `#5F8A85` | Input, checkbox and radio boundaries | 3.85 on card |
| `--ring` | `#0F766E` | Focus ring (2px, 2px offset) | 5.25 on background |
| `--code` | `#0F172A` | Code block surface | - |
| `--code-foreground` | `#F8FAFC` | Code text | 17.06 |
| `--code-muted` | `#94A3B8` | Code comments, line labels | 6.96 |
| `--code-accent` | `#22C55E` | Shell prompt `$`, copy-success icon | 7.83 |
| `--code-highlight` | `#5EEAD4` | Strings / keys in code | 12.07 |

Rules:
- One accent (amber) used only for achievement and caution. Teal is the brand/action color.
- No gradients on surfaces or text. No purple, no glows, no pure black (`#000`).
- Color is never the only signal: completed items also show a check icon and the word "Done"; errors
  show an icon and text.
- Dark code blocks are inset components, not page sections; the page theme stays light.

## Typography

Pairing: **Developer Mono** (UI/UX Pro Max): JetBrains Mono for display/headings/code, IBM Plex Sans
for UI and body. Self-hosted with `@fontsource/*` (`font-display: swap`), no Google Fonts link.

| Role | Font | Size (mobile / desktop) | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Display (Home h1) | JetBrains Mono | 32px / 48px | 600 | 1.1 | -0.02em |
| Page title (h1) | JetBrains Mono | 28px / 36px | 600 | 1.15 | -0.02em |
| Section (h2) | JetBrains Mono | 22px / 28px | 600 | 1.2 | -0.01em |
| Card / sub-section (h3) | IBM Plex Sans | 18px / 20px | 600 | 1.3 | 0 |
| Body | IBM Plex Sans | 16px | 400 | 1.6 | 0 |
| Small / meta | IBM Plex Sans | 14px | 500 | 1.5 | 0 |
| Code, commands | JetBrains Mono | 14px | 400 | 1.6 | 0 |

Rules: body text min 16px, meta min 14px, never below 14px. Reading width max 68ch.
No uppercase-tracked eyebrows except at most one per three Home sections. No em dashes (`—`) or
en dashes (`–`) in any visible string; use a hyphen, comma, colon or two sentences.

## Shape, elevation, spacing

- Radius: `--radius-control: 6px` (buttons, inputs, badges, checkboxes 4px), `--radius-panel: 10px`
  (cards, panels, code blocks, dialogs). No pills except the round avatar monogram.
- Shadows: only `--shadow-raised: 0 1px 2px rgb(19 78 74 / 0.06), 0 4px 12px rgb(19 78 74 / 0.06)` for
  the sticky header, sticky enrol card and dialogs. Cards use a 1px `--border` edge, no shadow.
- Spacing: 4px base. Section padding `py-16 md:py-24` on Home, `py-8 md:py-12` on app pages.
  Container `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`.
- Z-index scale (in `src/lib/z.ts`): header 30, mobile sheet/overlay 40, dialog 50, toast 60.

## Iconography

lucide-react only, `strokeWidth={1.75}` everywhere, sizes 16 (inline), 20 (buttons/list), 24 (feature).
Decorative icons next to text get `aria-hidden="true"`. Icon-only buttons get an `aria-label` and a 44x44
hit area. No emoji anywhere.

## Brand mark

Wordmark "AI Workboard" in JetBrains Mono 600 with a small `(AWS)` suffix in muted text, preceded by a
single geometric mark: a 20px rounded square in `--primary` with a 2x2 grid cut-out (simple CSS/SVG
rectangles, no illustration). No reference-site name, logo, copy or imagery.

## Motion (phase 2 contract; replaces the phase-1 "no automatic, scroll or looping motion" rules)

Weighting (Design Motion Principles): Home and Course, Jakub primary and Jhey secondary; Lesson, Lab, Quiz,
Dashboard, Emil primary (frequency gate: feedback motion only).

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Enters, reveals, draw-in |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | State change while visible (progress ring) |
| `--duration-fast` | 120ms | Hover/press color and `scale(0.98)` press |
| `--duration-base` | 200ms | Accordion content fade-in, mobile sheet enter, chevron rotate |
| `--duration-exit` | 150ms | Sheet/dialog exit (subtler than enter) |
| `--duration-slow` | 320ms | Progress bar fill, quiz result rise |
| `--duration-reveal` | 520ms | Scroll reveal (opacity, 12px rise, 4px blur), node fade-in |
| `--duration-draw` | 900ms | Hero hub connectors and topo contours drawing in |
| `--duration-ring` | 700ms | Progress ring fill |
| `--duration-flow` | 2800ms, linear, infinite | Hero request flow (the only loop) |
| `--stagger` | 70ms, capped at 8 steps | Reveal and node stagger |

Allowed:
- Home and Course: one-time scroll reveals of headings, grid items and sections; the hero hub diagram
  draws in once, then requests flow into the hub in a slow loop. The loop has a visible
  "Pause animation" toggle (44x44, `aria-pressed`) and is the only looping animation on the site.
- Topographic backdrops draw in once when revealed; the grid backdrop is static.
- Progress rings fill once; a lab step check badge pops once when ticked (180ms); quiz results rise in.
- Video "Up next": a 5-second countdown, cancellable; replaced by a "Play next" button under reduced
  motion (no autoplay).

Rules: only `transform`, `opacity`, `filter` and `stroke-dashoffset` animate; no bounce; no exit
animations added; no parallax or scroll-hijack. Under `prefers-reduced-motion: reduce` the components
render their final state (no flow layer, no pause toggle, reveals visible, rings and badges static) and
the global rule sets every transition/animation duration to 0.01ms as a backstop. Reveals also render
visible when `IntersectionObserver` is unavailable.

## Background art and AWS diagrams

- All art is original inline SVG/CSS in the existing color tokens: hero hub diagram, `grid` and `topo`
  section backdrops, six part motifs (console, text, media, shield, code, explore). Backdrops and motifs
  are `aria-hidden` and `pointer-events-none`; the hub diagram is `role="img"` with a full label.
- Backdrop contrast (worst pixel = text over a line): grid lines are primary at 9% over the canvas
  (`#DCF1ED`): foreground 8.05, muted 6.44, primary 4.65. Topo lines are primary at 10% (`#D9F0EC`):
  foreground 7.97, muted 6.37, primary 4.60. All text stays at or above 4.5:1.
- Official AWS Architecture Icons (`public/aws-icons/`, release 07/31/2026) are used unmodified as
  `<img>`/`<image>` files: the Amazon Bedrock icon at the hero hub, the AWS Cloud and Region group icons
  on the hero frames, and service icons on lab cards. They keep their official colors; the frames use the
  official AWS group colors `#242F3E` (AWS Cloud, solid) and `#00A4A6` (Region, dashed). These two values
  are allowed only inside AWS-style frames. Frame label text uses `--foreground` (the Region teal is
  3:1 on white, too low for text). Never recolor, crop or rotate the icons, and never use them as the
  AI Workboard mark (see `public/aws-icons/README.md`).
