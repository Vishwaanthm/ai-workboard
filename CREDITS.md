# Credits

## Stock media (public/media/), Pixabay Content License (https://pixabay.com/service/license-summary/)

| File | Used for | Source | Author |
| --- | --- | --- | --- |
| cover-entrance-*.webp | E01 cover (restaurant entrance, "one door") | https://pixabay.com/photos/japan-restaurant-front-traditional-2447944/ | nilamtouch |
| cover-typing-*.webp | E02 cover (typing, talking to a model) | https://pixabay.com/photos/notebook-typing-coffee-computer-1850613/ | Pexels |
| cover-plated-*.webp | E03 cover (a plated dish, dish photos) | https://pixabay.com/photos/bowl-dish-meal-fine-dining-gourmet-1850039/ | Pexels |
| cover-lock-*.webp | E04 cover (padlock on a laptop, the guardrail) | https://pixabay.com/photos/computer-security-padlock-hacker-1591018/ | TheDigitalWay |
| cover-code-*.webp | E05 cover and Labs band (code on a screen) | https://pixabay.com/photos/code-coding-computer-data-1839406/ | Pexels |
| analogy-kitchen-*.webp | Home "Bedrock is a restaurant" (working kitchen) | https://pixabay.com/photos/restaurant-kitchen-chefs-cooks-2623071/ | StockSnap |
| journey-plates-*.webp | Home Priya's journey (five plated dishes) | https://pixabay.com/photos/food-dishes-meals-cuisine-soup-366875/ | 51581 |

Fetched with the Pixabay API (key from PIXABAY_API_KEY, never committed), encoded to 640 and 1280 px
WebP; `scripts/fetch-media.mjs` lists the ids and the prep. The earlier part-*.webp covers were removed
with the part structure.

## Provider brand marks (public/brand-marks/), Simple Icons (CC0 1.0)

Anthropic, Meta, Mistral AI and DeepSeek marks from Simple Icons 16.36.0 (https://simpleicons.org),
unmodified files, drawn in one flat colour in the Home model strip beside each provider's name. The marks
are trademarks of their owners; AI Workboard is not affiliated with or endorsed by them (also stated in the
site footer). Stability AI, Cohere and Luma have no Simple Icons mark and stay text. See
public/brand-marks/README.md.

## Home hero field (original work)

The hero background is drawn in real time by `src/components/media/heroFieldGL.ts` (raw WebGL, no stock
footage). `hero-field-*.webp` are stills rendered from that shader. Its 2D simplex noise is by Ian McEwan,
Ashima Arts (MIT License, https://github.com/ashima/webgl-noise).

## Fonts (self-hosted via @fontsource-variable), SIL Open Font License 1.1

- Bricolage Grotesque (display), Mathieu Triay
- Instrument Sans (text), Rodrigo Fuenzalida / Instrument
- Geist Mono (code), Vercel

## AWS Architecture Icons

public/aws-icons/, see its README for the usage terms. Added 2026-10-30 from the same release
(07/31/2026): Amazon API Gateway (service/Arch_Amazon-API-Gateway_64.svg); AWS KMS was already present.
Amazon Nova is also the Amazon model chip's icon.
