/*
 * TODO(content): PLACEHOLDER DATA. Replace every entry below with the real labs.
 *
 * Nothing here is real lab material: steps, commands and code are generic placeholders that
 * exist only so the lab pages and their states (not started, in progress, done, untested) render.
 *
 * Shape (see src/data/types.ts):
 *   labs  Lab[]  { id, episodeId, title, tags[], objectives[], prerequisites[], costNote,
 *                  steps: { id, title, detail, code?: { lang, label, code } }[],
 *                  expected, untested?, services? }
 *                  services: official AWS icon names (AwsIconName in types.ts) shown on the lab card
 *
 * Rules (checked by validateCourseData in src/data/validate.ts):
 *   - lab ids are unique URL slugs (/labs/<id>); step ids are unique within a lab
 *   - lab.episodeId exists and that episode's labId points back to this lab
 *   - keep ids stable once published: learner progress is stored by lab id and step id
 */
import type { Lab } from './types'

/** Set to false once this file holds real content (stops the dev-console placeholder warning). */
export const IS_PLACEHOLDER = true

export const labs: Lab[] = [
  {
    id: 'lab-1',
    episodeId: 1,
    title: 'Lab 1 title',
    tags: ['Tag 1', 'Tag 2'],
    services: ['bedrock'],
    objectives: ['Objective 1 goes here.', 'Objective 2 goes here.'],
    prerequisites: ['Prerequisite 1 goes here.'],
    costNote: 'Cost note goes here.',
    steps: [
      { id: 'step-1', title: 'Step 1', detail: 'Step 1 instructions go here.' },
      { id: 'step-2', title: 'Step 2', detail: 'Step 2 instructions go here.' },
      { id: 'step-3', title: 'Step 3', detail: 'Step 3 instructions go here.' },
    ],
    expected: 'Expected outcome goes here.',
  },
  {
    id: 'lab-2',
    episodeId: 5,
    title: 'Lab 2 title',
    tags: ['Tag 1'],
    services: ['lambda', 'iam', 'bedrock'],
    objectives: ['Objective 1 goes here.'],
    prerequisites: ['Prerequisite 1 goes here.', 'Prerequisite 2 goes here.'],
    costNote: 'Cost note goes here.',
    untested: true,
    steps: [
      { id: 'step-1', title: 'Step 1', detail: 'Step 1 instructions go here.' },
      {
        id: 'step-2',
        title: 'Step 2',
        detail: 'Step 2 instructions go here. This step has a command to copy.',
        code: { lang: 'bash', label: 'Command for step 2', code: 'echo "Command goes here"' },
      },
      {
        id: 'step-3',
        title: 'Step 3',
        detail: 'Step 3 instructions go here. This step has a code file to copy.',
        code: {
          lang: 'python',
          label: 'Code for step 3',
          code: '# Code goes here.\nprint("Placeholder")',
        },
      },
    ],
    expected: 'Expected outcome goes here.',
  },
]
