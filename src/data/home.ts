/*
 * TODO(content): PARTLY PLACEHOLDER COPY. The analogy, the journey and the model providers follow the
 * production catalog (docs/catalog-v2.md); every "goes here" string is still a placeholder.
 *
 * Home page sections: the announcement bar (every page), the "Bedrock is a restaurant" analogy, the model
 * provider strip, "Explore by episode" code panels, Priya's journey, the learning hub and the closing
 * command. Episode titles, "Covers" lines, outcomes and chapters are NOT written here: those sections read
 * them from course.ts. The course content itself is the videos; keep these strings to short labels and the
 * catalog's own words.
 *
 * Shape: HomeSections (src/data/types.ts)
 *   announcement      { id, text, link?{label, href} } or null to hide the bar. A new id re-shows it.
 *   learnMenu         { labs, dashboard, certificate }  one line each under the header Learn menu links
 *   explore.snippets  [{ episodeId, label, lang, code }]  one code panel per episode (none shows no panel)
 *   models.providers  [{ name, models?[], mark?, service? }]  mark: Simple Icons file in public/brand-marks/;
 *                     service: an official AWS icon (AwsIconName) for Amazon's own models
 *   analogy           { title, quote, items[{ id, icon, title, meaning? }] }  icon: AnalogyIcon in types.ts
 *   journey           { title, lede, steps[{ episodeId, text }] }  one step per episode
 *   hub               { lede, cta{label, href}, posts[{ id, kind, title, text, date?, href? }],
 *                       events[{ id, title, date?, location, href? }] }  missing date shows "TBA"
 *   closingCommand    { label, code } or null
 *
 * Links: a path starting with "/" opens in the app (for example "/course#episode-2"); an http(s):// URL
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
    lede: 'Explore by episode intro goes here. One sentence.',
    snippets: [1, 2, 3, 4, 5].map((episodeId) => ({
      episodeId,
      label: `e0${episodeId}-snippet.txt`,
      lang: 'text' as const,
      code: `E0${episodeId} snippet goes here.\nReplace it in src/data/home.ts.`,
    })),
  },
  models: {
    lede: 'Model strip intro goes here. One sentence.',
    providers: [
      { name: 'Amazon', models: ['Nova Canvas', 'Nova Reel'], service: 'nova' },
      { name: 'Anthropic', mark: 'anthropic' },
      { name: 'Meta', mark: 'meta' },
      { name: 'Mistral', mark: 'mistral' },
      { name: 'DeepSeek', mark: 'deepseek' },
      { name: 'Stability AI' },
      { name: 'Cohere' },
      { name: 'Luma', models: ['Ray'] },
    ],
  },
  analogy: {
    title: 'Bedrock is a restaurant',
    quote:
      'One door, one menu, many chefs (the models), and you pay per dish (tokens). The restaurant manager is the guardrail, checking every order in and every plate out. The back kitchen holds knowledge bases, agents and custom models.',
    items: [
      { id: 'door', icon: 'door', title: 'One door' },
      { id: 'menu', icon: 'menu', title: 'One menu' },
      { id: 'chefs', icon: 'chef', title: 'Many chefs', meaning: 'The models' },
      { id: 'dish', icon: 'dish', title: 'Pay per dish', meaning: 'Tokens' },
      {
        id: 'manager',
        icon: 'manager',
        title: 'The restaurant manager',
        meaning: 'The guardrail, checking every order in and every plate out',
      },
      {
        id: 'kitchen',
        icon: 'kitchen',
        title: 'The back kitchen',
        meaning: 'Knowledge bases, agents and custom models',
      },
    ],
  },
  journey: {
    title: "Priya's dinner-idea app",
    lede: 'Priya builds a dinner-idea app, one step per episode.',
    steps: [
      { episodeId: 1, text: 'Picks Bedrock' },
      { episodeId: 2, text: 'Picks a model and writes prompts' },
      { episodeId: 3, text: 'Makes dish photos' },
      { episodeId: 4, text: 'Adds a guardrail' },
      { episodeId: 5, text: 'Ships it with Lambda and logging' },
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
