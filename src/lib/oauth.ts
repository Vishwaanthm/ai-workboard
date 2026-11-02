/**
 * Sign in with Amazon Cognito: the OAuth 2.0 authorization code flow with PKCE, straight from the browser
 * (no backend, no client secret). Google, Microsoft and email/password all go through Cognito's hosted pages,
 * so this site never sees a password. Loaded only with the login pages.
 *
 * Only the identity in the ID token (email, name, expiry) is kept. The access and refresh tokens are dropped,
 * because nothing here calls a protected API. The ID token comes straight from Cognito's token endpoint over
 * TLS, which OpenID Connect accepts in place of checking its signature; its audience, nonce, type and expiry
 * are still checked below.
 */
import type { OAuthProfile } from './auth'
import { callbackUrl, getCognito } from './oauthConfig'
import { safeNext } from './redirect'

export type SignInMethod = 'Google' | 'Microsoft' | 'email'

const PENDING_KEY = 'awb:oauth:pending'
const PENDING_MAX_MS = 10 * 60 * 1000
const TRY_AGAIN = 'Sign-in could not be completed. Please try again.'

/** What the browser remembers between leaving for Cognito and coming back. Kept in sessionStorage. */
interface Pending {
  verifier: string
  state: string
  nonce: string
  next: string
  /** Milliseconds since the epoch. */
  at: number
}

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function randomToken(byteLength = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

/** The PKCE "S256" challenge for a verifier (RFC 7636). */
export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

/** Sends the browser to Cognito. `method` picks Google, Microsoft, or Cognito's own email page. */
export async function startSignIn(method: SignInMethod, next: string | null): Promise<void> {
  const cognito = getCognito()
  if (!cognito) throw new Error('Sign-in is not set up for this site yet.')
  if (!globalThis.crypto?.subtle) throw new Error('This browser cannot sign in here. Open the site over https.')
  const pending: Pending = {
    verifier: randomToken(),
    state: randomToken(16),
    nonce: randomToken(16),
    next: safeNext(next),
    at: Date.now(),
  }
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    throw new Error('This browser is blocking the storage that sign-in needs.')
  }
  const params = new URLSearchParams({
    client_id: cognito.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: callbackUrl(),
    state: pending.state,
    nonce: pending.nonce,
    code_challenge: await challengeFor(pending.verifier),
    code_challenge_method: 'S256',
  })
  if (method !== 'email') params.set('identity_provider', method)
  window.location.assign(`https://${cognito.domain}/oauth2/authorize?${params}`)
}

function takePending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY) // single use: a replayed callback finds nothing
    const value: unknown = raw ? JSON.parse(raw) : null
    if (typeof value !== 'object' || value === null) return null
    const { verifier, state, nonce, next, at } = value as Record<string, unknown>
    if (typeof verifier !== 'string' || typeof state !== 'string' || typeof nonce !== 'string') return null
    if (typeof next !== 'string' || typeof at !== 'number') return null
    return { verifier, state, nonce, next, at }
  } catch {
    return null
  }
}

function readClaims(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const binary = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const claims: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))))
    return typeof claims === 'object' && claims !== null ? (claims as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export type SignInResult = { ok: true; profile: OAuthProfile; next: string } | { ok: false; message: string }

const fail = (message: string): SignInResult => ({ ok: false, message })

async function complete(search: string): Promise<SignInResult> {
  const cognito = getCognito()
  const params = new URLSearchParams(search)
  const pending = takePending()
  if (!cognito) return fail('Sign-in is not set up for this site yet.')
  const error = params.get('error')
  if (error) return fail(error === 'access_denied' ? 'Sign-in was cancelled.' : TRY_AGAIN)
  const code = params.get('code')
  if (!pending || !code || params.get('state') !== pending.state || Date.now() - pending.at > PENDING_MAX_MS) {
    return fail('This sign-in link is not valid any more. Please start again.')
  }
  let idToken: unknown
  try {
    const response = await fetch(`https://${cognito.domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: cognito.clientId,
        code,
        redirect_uri: callbackUrl(),
        code_verifier: pending.verifier,
      }),
    })
    if (!response.ok) return fail(TRY_AGAIN)
    idToken = ((await response.json()) as { id_token?: unknown }).id_token
  } catch {
    return fail('Could not reach the sign-in service. Check your connection and try again.')
  }
  const claims = typeof idToken === 'string' ? readClaims(idToken) : null
  const valid =
    claims !== null &&
    claims.aud === cognito.clientId &&
    claims.nonce === pending.nonce &&
    claims.token_use === 'id' &&
    typeof claims.iss === 'string' &&
    claims.iss.startsWith('https://cognito-idp.') &&
    typeof claims.exp === 'number' &&
    claims.exp * 1000 > Date.now() &&
    typeof claims.email === 'string'
  if (!valid) return fail(TRY_AGAIN)
  return {
    ok: true,
    profile: {
      email: claims.email as string,
      name: typeof claims.name === 'string' ? claims.name : undefined,
      exp: claims.exp as number,
    },
    next: pending.next,
  }
}

/** One run per callback URL, so React's double effect in development cannot use the one-time code twice. */
const runs = new Map<string, Promise<SignInResult>>()

/** Completes a sign-in from the callback URL's query string (`?code=...&state=...`). */
export function finishSignIn(search: string): Promise<SignInResult> {
  let run = runs.get(search)
  if (!run) {
    run = complete(search)
    runs.set(search, run)
  }
  return run
}
