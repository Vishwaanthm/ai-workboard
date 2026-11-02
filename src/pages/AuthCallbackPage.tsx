import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthShell } from '@/components/AuthShell'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/callout'
import { useAppState } from '@/context/useAppState'
import { authFailureMessage } from '@/lib/auth'
import { finishSignIn } from '@/lib/oauth'
import { safeNext } from '@/lib/redirect'

/** Where Cognito sends the learner back (/auth/callback?code=...). Finishes the sign-in, then moves on. */
export default function AuthCallbackPage() {
  const { completeOAuthSignIn } = useAppState()
  const navigate = useNavigate()
  const { search } = useLocation()
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    let active = true
    void finishSignIn(search).then((result) => {
      if (!active) return
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      const signedIn = completeOAuthSignIn(result.profile)
      if (signedIn.ok) navigate(safeNext(result.next), { replace: true })
      else
        setMessage(
          signedIn.reason === 'storage'
            ? authFailureMessage.storage
            : 'Sign-in could not be completed. Please try again.',
        )
    })
    return () => {
      active = false
    }
  }, [search, completeOAuthSignIn, navigate])

  return (
    <AuthShell>
      <PageHeading
        title={message ? 'Sign-in did not finish' : 'Signing you in'}
        className="text-[34px] leading-[1.05] font-extrabold md:text-[44px]"
      />
      {message ? (
        <div className="mt-8 flex flex-col gap-6">
          <Callout tone="caution" title="We could not sign you in">
            <p role="alert">{message}</p>
          </Callout>
          <Button asChild size="lg">
            <Link to="/login">Back to log in</Link>
          </Button>
        </div>
      ) : (
        <p role="status" className="mt-3 text-muted-foreground">
          Finishing sign-in...
        </p>
      )}
    </AuthShell>
  )
}
