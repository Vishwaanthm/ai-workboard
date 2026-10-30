// Bundle budget check (PLAN-PHASE2.md criterion 15). Run after `npm run build`.
// Resolves the entry chunk, the Home page chunk and the lazily loaded hero field renderer from the Vite
// manifest and gzips each file separately (level 9). Fails if Home >= 17769 bytes, the entry grew by more
// than 5120 bytes, or the hero field chunk (raw WebGL, loaded after the hero copy) reaches 8192 bytes.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = 'dist'
const BUDGET = {
  home: { key: 'src/pages/HomePage.tsx', max: 2409 + 15360 },
  entry: { key: 'index.html', max: 80075 + 5120 },
  field: { key: 'src/components/media/heroFieldGL.ts', max: 8192 },
}

const manifest = JSON.parse(readFileSync(join(DIST, '.vite', 'manifest.json'), 'utf8'))
let failed = false
for (const [name, { key, max }] of Object.entries(BUDGET)) {
  const chunk = manifest[key]
  if (!chunk) {
    console.error(`[size] ${name}: no manifest entry for ${key}`)
    failed = true
    continue
  }
  const bytes = gzipSync(readFileSync(join(DIST, chunk.file)), { level: 9 }).length
  const ok = bytes < max
  console.log(`[size] ${name.padEnd(5)} ${chunk.file}  gzip ${bytes} B  (budget < ${max} B)  ${ok ? 'ok' : 'OVER'}`)
  if (!ok) failed = true
}
process.exit(failed ? 1 : 0)
