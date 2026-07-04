/**
 * Toast notification types aligned with ui-interaction-skills toast-notification spec
 */

/** Notification semantic type */
export type NotificationType = 'success' | 'error' | 'info' | 'warn' | 'loading'

/** Options when showing or updating a notification */
export interface NotificationShowOptions {
  /** Progress percentage for loading notifications (0–100) */
  progress?: number
  /** Indeterminate progress bar for loading notifications */
  indeterminate?: boolean
  /** Auto-dismiss duration in milliseconds */
  duration?: number
}

/** Stored notification item */
export interface NotificationItem {
  /** Unique notification id */
  id: string
  /** Message body */
  message: string
  /** Semantic type */
  type: NotificationType
  /** Auto-dismiss duration in milliseconds (0 = persistent) */
  duration: number
  /** Progress percentage for loading notifications */
  progress?: number
  /** Whether loading progress is indeterminate */
  indeterminate?: boolean
  /** Whether exit animation is playing */
  closing?: boolean
}

/** Partial update payload */
export interface NotificationUpdate extends NotificationShowOptions {
  /** Updated message */
  message?: string
  /** Updated type */
  type?: NotificationType
}

/** Handle returned for loading notifications */
export interface NotificationLoadingHandle {
  /** Notification id */
  id: string
  /** Update progress or message while loading */
  setProgress: (progress: number, message?: string) => void
  /** Mark loading as successful */
  done: (message?: string) => void
  /** Mark loading as failed */
  fail: (message?: string) => void
  /** Dismiss immediately */
  close: () => void
}

/** Imperative notification API */
export interface NotificationApi {
  /** Show a notification and return its id */
  show: (message: string, type?: NotificationType, duration?: number, options?: NotificationShowOptions) => string
  /** Update an existing notification */
  update: (id: string, updates: NotificationUpdate) => void
  /** Dismiss a notification */
  close: (id: string) => void
  /** Show an info notification */
  info: (message: string, duration?: number) => string
  /** Show a success notification */
  success: (message: string, duration?: number) => string
  /** Show an error notification */
  error: (message: string, duration?: number) => string
  /** Show a warning notification */
  warn: (message: string, duration?: number) => string
  /** Show a loading notification with helper methods */
  loading: (message: string, options?: NotificationShowOptions) => NotificationLoadingHandle
}

/** Default auto-dismiss duration for non-loading notifications (ms) */
export const NOTIFICATION_DEFAULT_DURATION = 3000

/** Exit animation duration used as close fallback (ms) */
export const NOTIFICATION_CLOSE_ANIMATION_MS = 320
