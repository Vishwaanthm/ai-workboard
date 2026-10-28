import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAppState } from '@/context/useAppState'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex min-h-11 items-center rounded-control px-3 font-medium transition-colors duration-[120ms]',
    isActive ? 'text-primary underline decoration-2 underline-offset-8' : 'text-foreground hover:text-primary',
  )

export function SiteHeader() {
  const { user, logout } = useAppState()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  const links = [
    { to: '/course', label: 'Course' },
    { to: '/labs', label: 'Labs' },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
  ]

  const handleLogout = () => {
    close()
    logout()
    navigate('/')
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="max-w-40 truncate text-sm text-muted-foreground" title={user.name}>
                {user.name}
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut aria-hidden="true" strokeWidth={1.75} />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Start the course</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu aria-hidden="true" strokeWidth={1.75} />
            </Button>
          </SheetTrigger>
          <SheetContent title="Menu" description="Site navigation and account links">
            <nav aria-label="Main" className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={navLinkClass} onClick={close}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground">Signed in as {user.name}</p>
                  <Button variant="secondary" onClick={handleLogout}>
                    <LogOut aria-hidden="true" strokeWidth={1.75} />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link to="/register" onClick={close}>
                      Start the course
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link to="/login" onClick={close}>
                      Log in
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
