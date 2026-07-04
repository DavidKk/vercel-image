'use client'

/**
 * Centered empty state for Studio panels and canvas regions
 */
import { Spinner } from '@/components/Spinner'

/** Props for panel empty state */
export interface PanelEmptyStateProps {
  /** Optional short label (e.g. "No data") */
  title?: string
  /** Primary empty state message */
  message: string
  /** Optional secondary hint */
  hint?: string
  /** Optional classes for the primary message */
  messageClassName?: string
  /** Show a spinner above the message */
  loading?: boolean
  /** Root wrapper classes */
  className?: string
}

/**
 * Flex-centered empty state block for panel bodies
 * @param props Empty state configuration
 * @returns Centered empty state element
 */
export function PanelEmptyState(props: PanelEmptyStateProps) {
  const { title, message, hint, messageClassName, loading = false, className = '' } = props
  const rootClass = ['flex min-h-0 flex-1 items-center justify-center px-4 py-6', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="status" aria-busy={loading || undefined}>
      <div className="max-w-[16rem] text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner className="h-6 w-6" color="text-[var(--studio-surface-fg-subtle)]" />
            <p className="text-sm leading-snug text-[var(--studio-surface-fg-muted)]">{message}</p>
          </div>
        ) : (
          <>
            {title ? <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--studio-surface-fg-subtle)]">{title}</p> : null}
            <p className={`text-sm leading-snug text-[var(--studio-surface-fg-muted)] ${title ? 'mt-1' : ''} ${messageClassName ?? ''}`}>{message}</p>
            {hint ? <p className="mt-1.5 text-xs leading-snug text-[var(--studio-surface-fg-subtle)]">{hint}</p> : null}
          </>
        )}
      </div>
    </div>
  )
}
