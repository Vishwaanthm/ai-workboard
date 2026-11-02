import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from '@/lib/auth'
import { challengeFor, finishSignIn, startSignIn } from '@/lib/oauth'
import { getCognito } from '@/lib/oauthConfig'
import { storageKeys } from '@/lib/storage'
import { renderApp } from './helpers'

const DOMAIN = 'workboard.auth.us-east-1.amazoncognito.com'
const CLIENT = 'client123'
const ISS = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_pool'

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const idToken = (claims: Record<string, unknown>) => `${b64({ alg: 'RS256' })}.${b64(claims)}.signature`
const inOneHour = () => Math.floor(Date.now() / 1000) + 3600

let assign: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('VITE_COGNITO_DOMAIN', DOMAIN)
  vi.stubEnv('VITE_COGNITO_CLIENT_ID', CLIENT)
  assign = vi.fn()
  vi.stubGlobal('location', { origin: 'http://localhost:3000', assign })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  window.sessionStorage.clear()
})

/** Starts a sign-in and returns what the browser sent to Cognito. */
async function begin(method: 'Google' | 'Microsoft' | 'email' = 'Google', next: string | null = null) {
  await startSignIn(method, next)
  const url = new URL(assign.mock.calls.at(-1)![0] as string)
  return { url, state: url.searchParams.get('state')!, nonce: url.searchParams.get('nonce')! }
}

/** Cognito's token endpoint answering with an ID token. */
function tokenEndpoint(claims: Record<string, unknown>) {
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ id_token: idToken(claims) }) }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('PKCE and the sign-in redirect', () => {
  it('computes the S256 challenge from the RFC 7636 example', async () => {
    expect(await challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    )
  })

  it('is off until both Cognito settings are given', () => {
    expect(getCognito()).toEqual({ domain: DOMAIN, clientId: CLIENT })
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '')
    expect(getCognito()).toBeNull()
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', CLIENT)
    vi.stubEnv('VITE_COGNITO_DOMAIN', `https://${DOMAIN}/`)
    expect(getCognito()?.domain).toBe(DOMAIN)
  })

  it('sends Google sign-in to the authorize endpoint with PKCE, state and a nonce', async () => {
    const { url, state } = await begin('Google', '/course')
    expect(url.origin + url.pathname).toBe(`https://${DOMAIN}/oauth2/authorize`)
    expect(url.searchParams.get('client_id')).toBe(CLIENT)
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('scope')).toBe('openid email profile')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/auth/callback')
    expect(url.searchParams.get('identity_provider')).toBe('Google')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    const pending = JSON.parse(window.sessionStorage.getItem('awb:oauth:pending')!)
    expect(pending.state).toBe(state)
    expect(pending.next).toBe('/course')
    expect(url.searchParams.get('code_challenge')).toBe(await challengeFor(pending.verifier))
    expect(url.search).not.toContain(pending.verifier) // the verifier never leaves the browser until the exchange
  })

  it('names Microsoft, and leaves the provider out for the email page', async () => {
    expect((await begin('Microsoft')).url.searchParams.get('identity_provider')).toBe('Microsoft')
    expect((await begin('email')).url.searchParams.has('identity_provider')).toBe(false)
  })

  it('ignores a next address that leaves the site', async () => {
    await begin('Google', '//evil.example/steal')
    expect(JSON.parse(window.sessionStorage.getItem('awb:oauth:pending')!).next).toBe('/dashboard')
  })
})

describe('finishing a sign-in', () => {
  const claims = (nonce: string, extra: Record<string, unknown> = {}) => ({
    iss: ISS,
    aud: CLIENT,
    token_use: 'id',
    exp: inOneHour(),
    nonce,
    email: 'Asha@Example.com',
    name: 'Asha Raman',
    ...extra,
  })

  it('swaps the code for an ID token and returns the learner', async () => {
    const { state, nonce } = await begin('Google', '/course')
    const verifier = JSON.parse(window.sessionStorage.getItem('awb:oauth:pending')!).verifier as string
    const fetchMock = tokenEndpoint(claims(nonce))
    const result = await finishSignIn(`?code=code-ok&state=${state}`)
    expect(result).toMatchObject({ ok: true, next: '/course', profile: { email: 'Asha@Example.com', name: 'Asha Raman' } })
    const [endpoint, init] = fetchMock.mock.calls[0] as unknown as [string, { method: string; body: URLSearchParams }]
    expect(endpoint).toBe(`https://${DOMAIN}/oauth2/token`)
    expect(init.method).toBe('POST')
    expect(init.body.get('grant_type')).toBe('authorization_code')
    expect(init.body.get('code')).toBe('code-ok')
    expect(init.body.get('code_verifier')).toBe(verifier)
    expect(window.sessionStorage.getItem('awb:oauth:pending')).toBeNull()
  })

  it('refuses a callback whose state does not match, without calling Cognito', async () => {
    const { nonce } = await begin()
    const fetchMock = tokenEndpoint(claims(nonce))
    const result = await finishSignIn('?code=code-bad-state&state=somebody-elses')
    expect(result.ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a replayed callback', async () => {
    const { state, nonce } = await begin()
    tokenEndpoint(claims(nonce))
    expect((await finishSignIn(`?code=code-once&state=${state}`)).ok).toBe(true)
    expect((await finishSignIn(`?code=code-twice&state=${state}`)).ok).toBe(false)
  })

  it('uses a code once even when the page runs its effect twice', async () => {
    const { state, nonce } = await begin()
    const fetchMock = tokenEndpoint(claims(nonce))
    const search = `?code=code-double&state=${state}`
    const [a, b] = await Promise.all([finishSignIn(search), finishSignIn(search)])
    expect(a.ok && b.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a different nonce', (n: string) => claims(`${n}x`)],
    ['another app client', (n: string) => claims(n, { aud: 'someone-else' })],
    ['an expired token', (n: string) => claims(n, { exp: Math.floor(Date.now() / 1000) - 60 })],
    ['an access token', (n: string) => claims(n, { token_use: 'access' })],
    ['a foreign issuer', (n: string) => claims(n, { iss: 'https://evil.example' })],
    ['no email', (n: string) => claims(n, { email: undefined })],
  ])('rejects an ID token with %s', async (label, build) => {
    const { state, nonce } = await begin()
    tokenEndpoint(build(nonce))
    const result = await finishSignIn(`?code=code-${label.replace(/\W/g, '')}&state=${state}`)
    expect(result.ok).toBe(false)
  })

  it('reports a cancelled sign-in and a token endpoint failure plainly', async () => {
    await begin()
    expect(await finishSignIn('?error=access_denied&error_description=nope')).toEqual({
      ok: false,
      message: 'Sign-in was cancelled.',
    })
    const { state } = await begin()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    const failed = await finishSignIn(`?code=code-500&state=${state}`)
    expect(failed.ok).toBe(false)
  })
})

describe('OAuth accounts in this browser', () => {
  it('stores no password and cannot be opened with one', async () => {
    const result = auth.signInWithProfile({ email: 'Asha@Example.com', name: 'Asha Raman', exp: inOneHour() })
    expect(result).toMatchObject({ ok: true, account: { email: 'asha@example.com', provider: 'cognito' } })
    const stored = auth.readAccounts()['asha@example.com']!
    expect(stored.passwordHash).toBeUndefined()
    expect(stored.salt).toBeUndefined()
    expect(auth.readSessionAccount()?.email).toBe('asha@example.com')
    expect(await auth.login('asha@example.com', 'anything at all')).toEqual({ ok: false, reason: 'credentials' })
  })

  it('ends the session when the ID token expires', () => {
    auth.signInWithProfile({ email: 'asha@example.com', name: 'Asha', exp: Math.floor(Date.now() / 1000) - 5 })
    expect(auth.readSessionAccount()).toBeNull()
  })

  it('falls back to the part of the email before the @ when there is no name', () => {
    const result = auth.signInWithProfile({ email: 'priya@example.com', exp: inOneHour() })
    expect(result).toMatchObject({ ok: true, account: { name: 'priya' } })
  })

  it('keeps the first sign-in date and the same progress key on a later sign-in', () => {
    const first = auth.signInWithProfile({ email: 'asha@example.com', name: 'Asha', exp: inOneHour() })
    window.localStorage.setItem(storageKeys.progress('asha@example.com'), '{}')
    const again = auth.signInWithProfile({ email: 'ASHA@example.com', name: 'Asha R', exp: inOneHour() })
    expect(first.ok && again.ok && again.account.createdAt === first.account.createdAt).toBe(true)
    expect(window.localStorage.getItem(storageKeys.progress('asha@example.com'))).toBe('{}')
  })
})

describe('the login pages with Cognito set up', () => {
  it('offers Google, Microsoft and email, and no password field', async () => {
    renderApp('/login')
    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with email/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('offers the same choices on Create account', async () => {
    renderApp('/register')
    expect(await screen.findByRole('heading', { level: 1, name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up with email/i })).toBeInTheDocument()
  })

  it('opens Cognito when a provider is chosen', async () => {
    renderApp('/login')
    await userEvent.click(await screen.findByRole('button', { name: /continue with microsoft/i }))
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1))
    expect(new URL(assign.mock.calls[0]![0] as string).searchParams.get('identity_provider')).toBe('Microsoft')
  })

  it('shows the plain demo form when Cognito is not configured', async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', '')
    renderApp('/login')
    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument()
  })

  it('finishes the sign-in on the callback page and goes where the learner was headed', async () => {
    const { state, nonce } = await begin('Google', '/course')
    tokenEndpoint({
      iss: ISS,
      aud: CLIENT,
      token_use: 'id',
      exp: inOneHour(),
      nonce,
      email: 'asha@example.com',
      name: 'Asha Raman',
    })
    const { router } = renderApp(`/auth/callback?code=code-page&state=${state}`)
    await waitFor(() => expect(router.state.location.pathname).toBe('/course'))
    expect(auth.readSessionAccount()).toMatchObject({ email: 'asha@example.com', name: 'Asha Raman', provider: 'cognito' })
  })

  it('explains a failed sign-in and links back to log in', async () => {
    renderApp('/auth/callback?error=access_denied')
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in was cancelled.')
    expect(screen.getByRole('link', { name: 'Back to log in' })).toHaveAttribute('href', '/login')
  })
})
