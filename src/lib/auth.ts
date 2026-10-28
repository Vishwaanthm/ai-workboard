/** Demo-only accounts kept in this browser. Passwords are salted SHA-256 hashes; this is not real security. */
import { hasWebCrypto, randomHex, sha256Hex } from './hash'
import { type Account, type Accounts, NAME_MAX, validateAccounts, validateSession } from './schema'
import { readJSON, removeKey, storageKeys, writeJSON } from './storage'

export const PASSWORD_MIN = 8

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export type RegisterErrors = Partial<Record<keyof RegisterInput, string>>

export function validateRegistration(input: RegisterInput): RegisterErrors {
  const errors: RegisterErrors = {}
  const name = input.name.trim()
  if (!name) errors.name = 'Enter your name.'
  else if (name.length > NAME_MAX) errors.name = `Use ${NAME_MAX} characters or fewer.`
  if (!input.email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(normaliseEmail(input.email))) {
    errors.email = 'Enter an email address like name@example.com.'
  }
  if (!input.password) errors.password = 'Enter a password.'
  else if (input.password.length < PASSWORD_MIN) {
    errors.password = `Use at least ${PASSWORD_MIN} characters.`
  }
  return errors
}

export function readAccounts(): Accounts {
  return readJSON<Accounts>(storageKeys.accounts, {}, validateAccounts)
}

export function readSessionAccount(): Account | null {
  const accounts = readAccounts()
  const session = readJSON(storageKeys.session, null, (v) => validateSession(v, accounts))
  return session ? (accounts[session.email] ?? null) : null
}

export type AuthFailure = 'exists' | 'credentials' | 'unsupported' | 'storage'

export type AuthResult =
  | { ok: true; account: Account }
  | { ok: false; reason: 'invalid'; errors: RegisterErrors }
  | { ok: false; reason: AuthFailure }

export const authFailureMessage: Record<AuthFailure, string> = {
  exists: 'An account with this email already exists in this browser. Log in instead.',
  credentials: 'Email or password is incorrect.',
  unsupported: 'This browser cannot create a demo account here. Open the site over https or localhost.',
  storage: 'This browser is not saving data, so the account could not be stored.',
}

function hashPassword(salt: string, password: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const errors = validateRegistration(input)
  if (Object.keys(errors).length > 0) return { ok: false, reason: 'invalid', errors }
  if (!hasWebCrypto()) return { ok: false, reason: 'unsupported' }
  const email = normaliseEmail(input.email)
  const accounts = readAccounts()
  if (Object.hasOwn(accounts, email)) return { ok: false, reason: 'exists' }
  const salt = randomHex(16)
  const account: Account = {
    name: input.name.trim(),
    email,
    salt,
    passwordHash: await hashPassword(salt, input.password),
    createdAt: new Date().toISOString(),
  }
  if (!writeJSON(storageKeys.accounts, { ...accounts, [email]: account })) {
    return { ok: false, reason: 'storage' }
  }
  if (!writeJSON(storageKeys.session, { email })) {
    // Roll back so a retry does not hit "already exists" for an account that was never usable.
    if (Object.keys(accounts).length > 0) writeJSON(storageKeys.accounts, accounts)
    else removeKey(storageKeys.accounts)
    return { ok: false, reason: 'storage' }
  }
  return { ok: true, account }
}

export async function login(emailInput: string, password: string): Promise<AuthResult> {
  if (!hasWebCrypto()) return { ok: false, reason: 'unsupported' }
  const email = normaliseEmail(emailInput)
  const accounts = readAccounts()
  const account = Object.hasOwn(accounts, email) ? accounts[email] : undefined
  if (!account) return { ok: false, reason: 'credentials' }
  if ((await hashPassword(account.salt, password)) !== account.passwordHash) {
    return { ok: false, reason: 'credentials' }
  }
  if (!writeJSON(storageKeys.session, { email })) return { ok: false, reason: 'storage' }
  return { ok: true, account }
}

export function logout(): void {
  removeKey(storageKeys.session)
}
