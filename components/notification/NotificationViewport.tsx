'use client'

/**
 * Toast notification viewport — top-right stack with Studio styling
 */
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'

import { InlineProgressBar } from '@/components/InlineProgressBar'

import type { NotificationItem, NotificationType } from './types'
import { NOTIFICATION_CLOSE_ANIMATION_MS } from './types'

interface NotificationViewportProps {
  /** Active notifications */
  items: NotificationItem[]
  /** Dismiss handler */
  onClose: (id: string) => void
}

/** Visual config per notification type */
const TYPE_STYLES: Record<NotificationType, { border: string; icon: string; iconClass: string }> = {
  success: {
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    iconClass: 'bg-emerald-50',
  },
  error: {
    border: 'border-red-200',
    icon: 'text-red-600',
    iconClass: 'bg-red-50',
  },
  info: {
    border: 'border-blue-200',
    icon: 'text-blue-600',
    iconClass: 'bg-blue-50',
  },
  warn: {
    border: 'border-amber-200',
    icon: 'text-amber-600',
    iconClass: 'bg-amber-50',
  },
  loading: {
    border: 'border-[var(--studio-panel-border)]',
    icon: 'text-blue-600',
    iconClass: 'bg-blue-50',
  },
}

/**
 * Render the notification type icon
 * @param type Notification type
 * @returns Icon element
 */
function NotificationIcon(props: { type: NotificationType }) {
  const { type } = props
  const iconClass = `h-4 w-4 ${TYPE_STYLES[type].icon}`

  switch (type) {
    case 'success':
      return <FiCheckCircle className={iconClass} aria-hidden />
    case 'error':
      return <FiAlertCircle className={iconClass} aria-hidden />
    case 'warn':
      return <FiAlertTriangle className={iconClass} aria-hidden />
    default:
      return <FiInfo className={iconClass} aria-hidden />
  }
}

/**
 * Single toast notification card
 * @param props Item props
 * @returns Notification card element
 */
function NotificationCard(props: { item: NotificationItem; onClose: (id: string) => void }) {
  const { item, onClose } = props
  const styles = TYPE_STYLES[item.type]

  if (item.type === 'loading') {
    return (
      <div
        role="status"
        className={`notification-enter pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-lg border bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm ${styles.border} ${
          item.closing ? 'notification--closing' : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <InlineProgressBar label={item.message} progress={item.indeterminate ? undefined : item.progress} indeterminate={item.indeterminate ?? item.progress == null} size="sm" />
        </div>

        <button
          type="button"
          onClick={() => onClose(item.id)}
          aria-label="Dismiss"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <FiX className="h-4 w-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      role="status"
      className={`notification-enter pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm ${styles.border} ${
        item.closing ? 'notification--closing' : ''
      }`}
    >
      <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${styles.iconClass}`}>
        <NotificationIcon type={item.type} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-gray-800">{item.message}</p>
      </div>

      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label="Dismiss"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <FiX className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

/**
 * Fixed notification stack rendered in the top-right corner
 * @param props Viewport props
 * @returns Viewport element
 */
export function NotificationViewport(props: NotificationViewportProps) {
  const { items, onClose } = props

  if (items.length === 0) return null

  return (
    <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed right-4 top-4 z-[10000] flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-2">
      {items.map((item) => (
        <NotificationCard key={item.id} item={item} onClose={onClose} />
      ))}
    </div>
  )
}

export { NOTIFICATION_CLOSE_ANIMATION_MS }
