/**
 * The only episode that touches window.localStorage. Every call is wrapped so that disabled
 * storage, quota errors and malformed JSON fall back safely instead of crashing the app.
 */
export const STORAGE_PREFIX = 'awb:v1:'

export const storageKeys = {
  accounts: `${STORAGE_PREFIX}accounts`,
  session: `${STORAGE_PREFIX}session`,
  progress: (email: string) => `${STORAGE_PREFIX}progress:${email}`,
  /** Player preferences (language, speed); not tied to an account. */
  prefs: `${STORAGE_PREFIX}prefs`,
} as const

function getStore(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function isStorageAvailable(): boolean {
  const store = getStore()
  if (!store) return false
  const probe = `${STORAGE_PREFIX}probe`
  try {
    store.setItem(probe, '1')
    store.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/** Reads and validates a JSON value. `validate` returns the cleaned value, or null to reject it. */
export function readJSON<T>(key: string, fallback: T, validate: (value: unknown) => T | null): T {
  const store = getStore()
  if (!store) return fallback
  let raw: string | null
  try {
    raw = store.getItem(key)
  } catch (error) {
    console.warn(`[storage] could not read ${key}`, error)
    return fallback
  }
  if (raw === null) return fallback
  try {
    const cleaned = validate(JSON.parse(raw))
    return cleaned === null ? fallback : cleaned
  } catch (error) {
    console.warn(`[storage] ignoring malformed value in ${key}`, error)
    return fallback
  }
}

/** Returns false when the value could not be saved (storage disabled or full). */
export function writeJSON(key: string, value: unknown): boolean {
  const store = getStore()
  if (!store) return false
  try {
    store.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`[storage] could not write ${key}`, error)
    return false
  }
}

export function removeKey(key: string): boolean {
  const store = getStore()
  if (!store) return false
  try {
    store.removeItem(key)
    return true
  } catch (error) {
    console.warn(`[storage] could not remove ${key}`, error)
    return false
  }
}
