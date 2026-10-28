/** cyrb53: fast, synchronous 53-bit string hash (public domain, by bryc). Not cryptographic. */
export function cyrb53(input: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const FORTY_BITS = 2 ** 40

/** Encodes the low 40 bits of `value` as exactly 8 RFC 4648 base32 digits, most significant first. */
export function base32Of40Bits(value: number): string {
  let v = value % FORTY_BITS
  let out = ''
  for (let i = 0; i < 8; i++) {
    out = BASE32[v % 32] + out
    v = Math.floor(v / 32)
  }
  return out
}

export const CERTIFICATE_ID_PATTERN = /^AWB-[A-Z2-7]{4}-[A-Z2-7]{4}$/

/** Deterministic certificate ID for one learner and one course (see PLAN.md "Certificate issuance"). */
export function certificateId(email: string, courseTitle: string): string {
  const digits = base32Of40Bits(cyrb53(`${email.trim().toLowerCase()}|${courseTitle}`))
  return `AWB-${digits.slice(0, 4)}-${digits.slice(4)}`
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hasWebCrypto(): boolean {
  return typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined'
}

export function randomHex(byteCount = 16): string {
  const bytes = new Uint8Array(byteCount)
  globalThis.crypto.getRandomValues(bytes)
  return toHex(bytes)
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return toHex(digest)
}
