/*
 * TODO(content): PLACEHOLDER COPY. Replace every "goes here" string, snippet, card, post and event.
 *
 * Home page sections added in the Strands-style update: the announcement bar (every page), "Explore by
 * part" code panels, the model provider strip, "What you'll build" cards, the learning hub and the
 * closing command. Part names, part outcomes and episode titles are NOT written here: those sections read
 * them from course.ts. The course content itself is the videos; keep these strings to short labels.
 *
 * Shape: HomeSections (src/data/types.ts)
 *   announcement      { id, text, link?{label, href} } or null to hide the bar. A new id re-shows it.
 *   learnMenu         { labs, dashboard, certificate }  one line each under the header Learn menu links
 *   explore.snippets  [{ partId, label, lang, code }]  one code panel per part (a part without one shows none)
 *   models.providers  provider names, plain text (no logos)
 *   useCases.items    [{ id, partId, title, text, service?, href? }]  service: AwsIconName in types.ts
 *   hub               { lede, cta{label, href}, posts[{ id, kind, title, text, date?, href? }],
 *                       events[{ id, title, date?, location, href? }] }  missing date shows "TBA"
 *   closingCommand    { label, code } or null
 *
 * Links: a path starting with "/" opens in the app (for example "/course#part-2"); an http(s):// URL
 * opens the other site in a new tab. Anything else (for example "javascript:") is shown as plain text.
 */
import type { HomeSections } from './types'

/** Set to false once this file holds real content (stops the dev-console placeholder warning). */
export const IS_PLACEHOLDER = true

export const home: HomeSections = {
  announcement: {
    id: 'placeholder-1',
    text: 'Announcement text goes here.',
    link: { label: 'Announcement link', href: '/course' },
  },
  learnMenu: {
    labs: 'Labs menu line goes here.',
    dashboard: 'Dashboard menu line goes here.',
    certificate: 'Certificate menu line goes here.',
  },
  explore: {
    lede: 'Explore by part intro goes here. One sentence.',
    snippets: [1, 2, 3, 4, 5].map((partId) => ({
      partId,
      label: `part-${partId}-snippet.txt`,
      lang: 'text' as const,
      code: `Part ${partId} snippet goes here.\nReplace it in src/data/home.ts.`,
    })),
  },
  models: {
    lede: 'Model strip intro goes here. One sentence.',
    providers: ['Amazon', 'Anthropic', 'Meta', 'Mistral AI', 'Cohere', 'DeepSeek', 'Stability AI', 'Luma AI', 'Writer'],
  },
  useCases: {
    lede: 'What you will build intro goes here. One sentence.',
    items: [
      {
        id: 'use-case-1',
        partId: 1,
        title: 'Use case 1 title goes here',
        text: 'Use case 1 description goes here.',
        service: 'bedrock',
      },
      { id: 'use-case-2', partId: 2, title: 'Use case 2 title goes here', text: 'Use case 2 description goes here.' },
      { id: 'use-case-3', partId: 3, title: 'Use case 3 title goes here', text: 'Use case 3 description goes here.' },
      { id: 'use-case-4', partId: 4, title: 'Use case 4 title goes here', text: 'Use case 4 description goes here.' },
      {
        id: 'use-case-5',
        partId: 5,
        title: 'Use case 5 title goes here',
        text: 'Use case 5 description goes here.',
        service: 'lambda',
      },
    ],
  },
  hub: {
    lede: 'Learning hub intro goes here. One or two sentences.',
    cta: { label: 'Start learning', href: '/course' },
    posts: [
      { id: 'post-1', kind: 'Article', title: 'Post 1 title goes here', text: 'Post 1 summary goes here.' },
      { id: 'post-2', kind: 'Video', title: 'Post 2 title goes here', text: 'Post 2 summary goes here.' },
      { id: 'post-3', kind: 'Update', title: 'Post 3 title goes here', text: 'Post 3 summary goes here.' },
    ],
    events: [
      { id: 'event-1', title: 'Event 1 name goes here', location: 'Event location goes here' },
      { id: 'event-2', title: 'Event 2 name goes here', location: 'Event location goes here' },
    ],
  },
  closingCommand: { label: 'Command', code: 'command goes here' },
}
