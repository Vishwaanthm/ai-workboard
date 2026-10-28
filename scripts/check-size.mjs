// Bundle budget check (PLAN-PHASE2.md criterion 15). Run after `npm run build`.
// Resolves the entry chunk and the Home page chunk from the Vite manifest and gzips each file
// separately (level 9). Fails if Home >= 17769 bytes or the entry grew by more than 5120 bytes.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = 'dist'
const BUDGET = {
  home: { key: 'src/pages/HomePage.tsx', max: 2409 + 15360 },
  entry: { key: 'index.html', max: 80075 + 5120 },
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
