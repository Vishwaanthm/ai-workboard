import { Clapperboard } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAppState } from '@/context/useAppState'
import { PageHeading } from './PageHeading'
import { Button } from './ui/button'
import { Callout } from './ui/callout'
import { Skeleton } from './ui/skeleton'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

export function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-panel bg-code p-6 text-center text-code-foreground">
      <Clapperboard aria-hidden="true" strokeWidth={1.75} className="size-10 text-code-highlight" />
      <p className="font-mono text-lg font-semibold">Video coming soon</p>
      <p className="max-w-md text-sm text-code-muted">The lesson video for "{title}" is in production.</p>
    </div>
  )
}

export function StorageWarning() {
  const { storageAvailable } = useAppState()
  if (storageAvailable) return null
  return (
    <Container className="no-print pt-4">
      <Callout tone="caution" title="This browser is not saving data">
        <p>Your account and progress will be lost when you close this tab. Allow site data for this page to keep them.</p>
      </Callout>
    </Container>
  )
}

/** Sends guests to /login, remembering where they wanted to go. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAppState()
  const location = useLocation()
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <>{children}</>
}

/**
 * Login and register are for guests only: a signed-in learner is sent to the dashboard. While a page is
 * finishing its own successful login or registration, `authInProgress` is true so that page can send the
 * learner to the `next` they asked for instead.
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, authInProgress, finishAuth } = useAppState()
  // Leaving the login/register page ends the post-auth window.
  useEffect(() => finishAuth, [finishAuth])
  if (user && !authInProgress) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function NotFound() {
  return (
    <Container className="py-16 md:py-24">
      <PageHeading title="Page not found" />
      <p className="mt-4 max-w-[60ch] text-muted-foreground">
        The page you asked for does not exist. It may have moved, or the link may be wrong.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/">Go to home</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/course">View the course</Link>
        </Button>
      </div>
    </Container>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8" aria-busy="true">
      <span className="sr-only" role="status">
        Loading page
      </span>
      <Skeleton className="h-10 w-2/3 max-w-lg" />
      <Skeleton className="mt-6 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-3 h-4 w-5/6 max-w-xl" />
      <Skeleton className="mt-10 h-48 w-full" />
    </div>
  )
}
