import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** "in-app" for a site path, "external" for an absolute http(s) URL, null for anything else. */
export function linkKind(href: string): 'in-app' | 'external' | null {
  if (href.startsWith('/') && !href.startsWith('//')) return 'in-app'
  try {
    const url = new URL(href)
    return url.protocol === 'https:' || url.protocol === 'http:' ? 'external' : null
  } catch {
    return null
  }
}

/**
 * A link from content data: a site path ("/course#episode-2") stays in the app; an absolute http(s) URL
 * opens in a new tab with a screen reader hint. Any other value (for example "javascript:" or a typo)
 * is never emitted as an href: the content renders as plain text instead.
 */
export function SmartLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  const kind = linkKind(href)
  if (kind === 'in-app') {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }
  if (kind === 'external') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }
  return <span className={className}>{children}</span>
}
