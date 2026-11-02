import { Mail } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AuthShell } from '@/components/AuthShell'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { startSignIn, type SignInMethod } from '@/lib/oauth'

/** The official four-colour marks, drawn small as the providers' branding guidelines ask. */
const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 18 18" className="size-5">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
  </svg>
)

const MicrosoftMark = () => (
  <svg aria-hidden="true" viewBox="0 0 21 21" className="size-5">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
)

/**
 * Log in and Create account when Cognito is set up: Google, Microsoft or email through Cognito's hosted
 * pages. The two pages share this form because Cognito's email page offers both "Log in" and "Sign up".
 */
export function OAuthSignIn({ intent }: { intent: 'login' | 'register' }) {
  const [params] = useSearchParams()
  const next = params.get('next')
  const [pending, setPending] = useState<SignInMethod | null>(null)
  const [error, setError] = useState<string>()
  const register = intent === 'register'

  const go = async (method: SignInMethod) => {
    if (pending) return
    setPending(method)
    setError(undefined)
    try {
      await startSignIn(method, next)
    } catch (e) {
      setPending(null)
      setError(e instanceof Error ? e.message : 'Sign-in could not start. Please try again.')
    }
  }

  const choice = (method: SignInMethod, label: string, icon: ReactNode) => (
    <Button
      variant="secondary"
      size="lg"
      className="w-full"
      disabled={pending !== null}
      aria-busy={pending === method || undefined}
      onClick={() => go(method)}
    >
      {icon}
      {pending === method ? 'Opening sign-in...' : label}
    </Button>
  )

  return (
    <AuthShell>
      <PageHeading
        title={register ? 'Create your account' : 'Log in'}
        className="text-[34px] leading-[1.05] font-extrabold md:text-[44px]"
      />
      <p className="mt-3 text-muted-foreground">
        {register
          ? 'Choose how to sign up. Your course progress stays in this browser.'
          : 'Choose how to sign in. Your course progress stays in this browser.'}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        {error ? (
          <Callout tone="caution" title="Could not start sign-in">
            <p role="alert">{error}</p>
          </Callout>
        ) : null}
        {choice('Google', 'Continue with Google', <GoogleMark />)}
        {choice('Microsoft', 'Continue with Microsoft', <MicrosoftMark />)}
        <div className="my-1 flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          size="lg"
          className="w-full"
          disabled={pending !== null}
          aria-busy={pending === 'email' || undefined}
          onClick={() => go('email')}
        >
          <Mail aria-hidden="true" />
          {pending === 'email' ? 'Opening sign-in...' : register ? 'Sign up with email' : 'Continue with email'}
        </Button>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        You will leave this site for a moment to sign in securely. We never see your password.
      </p>
      <p className="mt-4 text-muted-foreground">
        {register ? 'Already have an account? ' : 'New here? '}
        <Link
          to={`${register ? '/login' : '/register'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="link"
        >
          {register ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </AuthShell>
  )
}
