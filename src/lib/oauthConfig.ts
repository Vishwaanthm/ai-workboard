/**
 * Cognito settings come from the build (VITE_COGNITO_DOMAIN, VITE_COGNITO_CLIENT_ID). Without both, the site
 * keeps its browser-only demo login. Kept tiny because the main bundle imports it; the sign-in flow itself
 * lives in oauth.ts and loads with the login pages.
 */
export type SocialProvider = 'Google' | 'Microsoft'

export interface CognitoConfig {
  /** Host of the Cognito domain, for example "ai-workboard.auth.us-east-1.amazoncognito.com". */
  domain: string
  clientId: string
  /** Social buttons to offer. Only list a provider once it is connected in Cognito (email is always offered). */
  providers: SocialProvider[]
}

export function getCognito(): CognitoConfig | null {
  const env = import.meta.env as Record<string, string | undefined>
  const domain = (env.VITE_COGNITO_DOMAIN ?? '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const clientId = (env.VITE_COGNITO_CLIENT_ID ?? '').trim()
  const wanted = (env.VITE_COGNITO_PROVIDERS ?? '').toLowerCase().split(',').map((p) => p.trim())
  const providers = (['Google', 'Microsoft'] as const).filter((p) => wanted.includes(p.toLowerCase()))
  return domain && clientId ? { domain, clientId, providers } : null
}

/** Where Cognito sends the learner back. Must be listed in the app client's callback URLs. */
export function callbackUrl(): string {
  return new URL(`${import.meta.env.BASE_URL}auth/callback`, window.location.origin).href
}

/** Cognito's sign-out page, which clears its own session and returns to the site's home page. */
export function signOutUrl(): string | null {
  const cognito = getCognito()
  if (!cognito) return null
  const home = new URL(import.meta.env.BASE_URL, window.location.origin).href
  return `https://${cognito.domain}/logout?${new URLSearchParams({ client_id: cognito.clientId, logout_uri: home })}`
}
