import { lazy, Suspense } from 'react'
import { isRouteErrorResponse, Link, Outlet, ScrollRestoration, useRouteError, type RouteObject } from 'react-router'
import { Toaster } from 'sonner'
import { AnnouncementBar } from './components/AnnouncementBar'
import { Container, GuestOnly, NotFound, PageSkeleton, RequireAuth, StorageWarning } from './components/misc'
import { PageHeading } from './components/PageHeading'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { Button } from './components/ui/button'

const HomePage = lazy(() => import('./pages/HomePage'))
const CoursePage = lazy(() => import('./pages/CoursePage'))
const LessonPage = lazy(() => import('./pages/LessonPage'))
const LabsPage = lazy(() => import('./pages/LabsPage'))
const LabPage = lazy(() => import('./pages/LabPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const CertificatePage = lazy(() => import('./pages/CertificatePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function Layout({ withScrollRestoration = true }: { withScrollRestoration?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] flex-col print:block print:min-h-0">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader />
      <StorageWarning />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
      <Toaster position="bottom-right" richColors={false} closeButton toastOptions={{ className: 'font-sans' }} />
      {withScrollRestoration ? <ScrollRestoration /> : null}
    </div>
  )
}

function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : 'An unexpected error occurred.'
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Container className="py-16">
        <PageHeading title="Something went wrong" />
        <p className="mt-4 text-muted-foreground">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>Reload the page</Button>
          <Button variant="secondary" asChild>
            <Link to="/">Go to home</Link>
          </Button>
        </div>
      </Container>
    </div>
  )
}

const learner = (element: React.ReactNode) => <RequireAuth>{element}</RequireAuth>
const guest = (element: React.ReactNode) => <GuestOnly>{element}</GuestOnly>

export function buildRoutes({ scrollRestoration = true } = {}): RouteObject[] {
  return [
    {
      element: <Layout withScrollRestoration={scrollRestoration} />,
      errorElement: <RouteError />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/course', element: <CoursePage /> },
        { path: '/learn/:episodeId', element: learner(<LessonPage />) },
        { path: '/labs', element: <LabsPage /> },
        { path: '/labs/:labId', element: learner(<LabPage />) },
        { path: '/quiz/:quizId', element: learner(<QuizPage />) },
        { path: '/certificate', element: learner(<CertificatePage />) },
        { path: '/login', element: guest(<LoginPage />) },
        { path: '/register', element: guest(<RegisterPage />) },
        { path: '/dashboard', element: learner(<DashboardPage />) },
        { path: '*', element: <NotFound /> },
      ],
    },
  ]
}
