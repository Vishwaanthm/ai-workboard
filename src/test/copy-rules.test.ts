import { describe, expect, it } from 'vitest'

const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/test/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const REFERENCE_BRAND = ['Up', 'Skills'].join('')
const REMOVED_FEATURE = ['co', 'ach'].join('')

describe('copy rules', () => {
  it('scans the app sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20)
  })

  it('has no em dash or en dash anywhere in src', () => {
    for (const [path, text] of Object.entries(sources)) {
      expect(text.includes(EM_DASH), `${path} contains an em dash`).toBe(false)
      expect(text.includes(EN_DASH), `${path} contains an en dash`).toBe(false)
    }
  })

  it('never mentions the reference site', () => {
    for (const [path, text] of Object.entries(sources)) {
      expect(text.toLowerCase().includes(REFERENCE_BRAND.toLowerCase()), path).toBe(false)
    }
  })

  it('has no AI Coach route, page or link (removed by the user)', () => {
    for (const [path, text] of Object.entries(sources)) {
      expect(text.toLowerCase().includes(REMOVED_FEATURE), path).toBe(false)
    }
  })
})
