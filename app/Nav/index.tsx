'use client'

/**
 * Global site navigation — chrome bar aligned with Studio TopBar
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiGithub } from 'react-icons/fi'

import { useLayoutVisibility } from '@/hooks/useLayoutVisibility'
import packageJson from '@/package.json'

import { DEFAULT_NAV } from './constants'

interface NavItem {
  name: string
  href: string
}

interface NavProps {
  /** Brand title shown beside the logo badge */
  title?: string
  /** Grouped navigation links */
  nav?: Record<string, NavItem[]>
}

const DEFAULT_TITLE = 'Vercel Image'
const GITHUB_URL = packageJson.repository?.url

/**
 * Flatten grouped nav entries for horizontal link rendering
 * @param nav Grouped navigation map
 * @returns Flat list of nav items
 */
function flattenNavItems(nav: Record<string, NavItem[]>): NavItem[] {
  return Object.values(nav).flat()
}

/**
 * Global navigation bar with Studio chrome styling
 * @param props Nav configuration
 * @returns Nav element or null when hidden for the current route
 */
export function Nav(props: NavProps) {
  const { title = DEFAULT_TITLE, nav = DEFAULT_NAV } = props
  const pathname = usePathname()
  const shouldHide = useLayoutVisibility()
  const items = flattenNavItems(nav)

  if (shouldHide) {
    return null
  }

  return (
    <nav
      aria-label="Site navigation"
      className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--studio-chrome-border)] bg-[var(--studio-chrome-bg)] px-3 text-[var(--studio-chrome-fg)] shadow-studio-sm"
    >
      <div className="flex min-w-0 items-center gap-2.5 border-r border-[var(--studio-chrome-border)] pr-3">
        <Link href="/studio" className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-studio-md bg-[var(--studio-accent)] text-[10px] font-bold text-[var(--studio-accent-fg)]"
            aria-hidden
          >
            VI
          </div>
          <span className="truncate text-sm font-semibold tracking-tight">{title}</span>
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'rounded-studio-md px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-[var(--studio-chrome-segment-active)] text-[var(--studio-chrome-fg)] shadow-studio-sm'
                  : 'text-[var(--studio-chrome-fg-muted)] hover:bg-[var(--studio-chrome-hover)] hover:text-[var(--studio-chrome-fg)]',
              ].join(' ')}
            >
              {item.name}
            </Link>
          )
        })}
      </div>

      {GITHUB_URL ? (
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-studio-md text-[var(--studio-chrome-fg-muted)] transition-colors hover:bg-[var(--studio-chrome-hover)] hover:text-[var(--studio-chrome-fg)]"
          aria-label="GitHub repository"
        >
          <FiGithub className="h-4 w-4" />
        </a>
      ) : null}
    </nav>
  )
}
