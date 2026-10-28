/** Minimal WebVTT parser for the transcript panel: cue start/end times and plain text. */
export interface Cue {
  start: number
  end: number
  text: string
}

const TIME = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/

export function parseTimestamp(value: string): number | null {
  const m = TIME.exec(value.trim())
  if (!m) return null
  const [, h, min, s, ms] = m
  return Number(h ?? 0) * 3600 + Number(min) * 60 + Number(s) + Number((ms ?? '0').padEnd(3, '0')) / 1000
}

/** Removes cue tags such as <v Speaker>, <c.class>, <b> and timestamps tags, and decodes basic entities. */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function parseVtt(source: string): Cue[] {
  const lines = (source.charCodeAt(0) === 0xfeff ? source.slice(1) : source).replace(/\r\n?/g, '\n').split('\n')
  const cues: Cue[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (line.includes('-->')) {
      const [left, right] = line.split('-->')
      const start = parseTimestamp(left ?? '')
      const end = parseTimestamp((right ?? '').trim().split(/\s+/)[0] ?? '')
      i++
      const text: string[] = []
      while (i < lines.length && (lines[i] ?? '').trim() !== '') {
        text.push(lines[i] ?? '')
        i++
      }
      const joined = cleanText(text.join(' '))
      if (start !== null && end !== null && joined) cues.push({ start, end, text: joined })
    } else {
      // Skip the header, NOTE/STYLE/REGION blocks and cue identifiers.
      i++
    }
  }
  return cues
}
