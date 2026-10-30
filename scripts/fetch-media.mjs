/**
 * Build-prep: downloads the stock media listed below from the Pixabay API and encodes it into
 * public/media/. Needs PIXABAY_API_KEY in the environment (never commit the key) and ffmpeg on PATH.
 * Run: node scripts/fetch-media.mjs   (the encoded files are committed; this only reruns the prep)
 * If Node cannot reach the API host on this network, fetch the same ids with curl or Python instead.
 * Licence: Pixabay Content License (https://pixabay.com/service/license-summary/). See CREDITS.md.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const KEY = process.env.PIXABAY_API_KEY
if (!KEY) throw new Error('Set PIXABAY_API_KEY first.')
const OUT = join(import.meta.dirname, '..', 'public', 'media')
const TMP = join(tmpdir(), 'aiw-media')
mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })
const UA = { 'User-Agent': 'ai-workboard-media-prep/1.0' }

/** fetch with a few retries (the API host sometimes times out on connect). */
async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, { headers: UA })
    } catch (err) {
      if (attempt >= 4) throw err
      await new Promise((r) => setTimeout(r, 1500 * attempt))
    }
  }
}

/** One photo per part theme. (The Home hero is a real-time shader, not stock media: see CREDITS.md.) */
export const MEDIA = [
  { kind: 'image', id: 3542290, name: 'part-ocean' },
  { kind: 'image', id: 2750627, name: 'part-midnight' },
  { kind: 'image', id: 5189430, name: 'part-sunrise' },
  { kind: 'image', id: 8317167, name: 'part-slate' },
  { kind: 'image', id: 8118380, name: 'part-forest' },
]

async function api(kind, id) {
  const res = await get(`https://pixabay.com/api/?key=${KEY}&id=${id}`)
  if (!res.ok) throw new Error(`Pixabay ${kind} ${id}: HTTP ${res.status}`)
  const hit = (await res.json()).hits?.[0]
  if (!hit) throw new Error(`Pixabay ${kind} ${id}: not found`)
  return hit
}

async function download(url, file) {
  const res = await get(url)
  if (!res.ok) throw new Error(`download ${url}: HTTP ${res.status}`)
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
}

const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
const credits = []

for (const m of MEDIA) {
  const hit = await api(m.kind, m.id)
  const raw = join(TMP, `${m.name}.jpg`)
  await download(hit.largeImageURL, raw)
  for (const w of [640, 1280]) {
    ff(['-i', raw, '-vf', `scale=${w}:-2`, '-c:v', 'libwebp', '-quality', '70', join(OUT, `${m.name}-${w}.webp`)])
  }
  credits.push({ file: m.name, source: hit.pageURL, author: hit.user, license: 'Pixabay Content License' })
}
writeFileSync(join(OUT, 'credits.json'), JSON.stringify(credits, null, 2) + '\n')
rmSync(TMP, { recursive: true, force: true })
console.log(credits)
