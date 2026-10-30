# Credits

## Stock media (public/media/), Pixabay Content License (https://pixabay.com/service/license-summary/)

| File | Source | Author |
| --- | --- | --- |
| part-ocean-*.webp | https://pixabay.com/photos/id-3542290/ | 51581 |
| part-midnight-*.webp | https://pixabay.com/photos/id-2750627/ | Felix-Mittermeier |
| part-sunrise-*.webp | https://pixabay.com/photos/id-5189430/ | TRINHDACTRUONG |
| part-slate-*.webp | https://pixabay.com/photos/id-8317167/ | Camera-man |
| part-forest-*.webp (server racks, Part 5 "Building") | https://pixabay.com/photos/id-8118380/ | cookieone |

Fetched with the Pixabay API (key from PIXABAY_API_KEY, never committed); `scripts/fetch-media.mjs` documents the prep.

## Home hero field (original work)

The hero background is drawn in real time by `src/components/media/heroFieldGL.ts` (raw WebGL, no stock
footage). `hero-field-*.webp` are stills rendered from that shader. Its 2D simplex noise is by Ian McEwan,
Ashima Arts (MIT License, https://github.com/ashima/webgl-noise).

## Fonts (self-hosted via @fontsource-variable), SIL Open Font License 1.1

- Bricolage Grotesque (display), Mathieu Triay
- Instrument Sans (text), Rodrigo Fuenzalida / Instrument
- Geist Mono (code), Vercel

## AWS Architecture Icons

public/aws-icons/, see its README for the usage terms.
