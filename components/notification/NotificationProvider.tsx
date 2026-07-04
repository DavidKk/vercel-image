'use client'

/**
 * Notification provider with imperative show / update / close API
 */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

import { bindNotificationApi } from './notification-api'
import { NOTIFICATION_CLOSE_ANIMATION_MS, NotificationViewport } from './NotificationViewport'
import type { NotificationApi, NotificationItem, NotificationLoadingHandle, NotificationShowOptions, NotificationType, NotificationUpdate } from './types'
import { NOTIFICATION_DEFAULT_DURATION } from './types'

type NotificationAction =
  | { type: 'add'; item: NotificationItem }
  | { type: 'patch'; id: string; patch: Partial<NotificationItem> }
  | { type: 'close-start'; id: string }
  | { type: 'remove'; id: string }

/**
 * Resolve default duration for a notification type
 * @param type Notification type
 * @param duration Explicit duration override
 * @returns Duration in milliseconds
 */
function resolveDuration(type: NotificationType, duration?: number): number {
  if (duration != null) return duration
  return type === 'loading' ? 0 : NOTIFICATION_DEFAULT_DURATION
}

/**
 * Notification list reducer
 * @param state Current notifications
 * @param action Reducer action
 * @returns Next notification list
 */
function notificationReducer(state: NotificationItem[], action: NotificationAction): NotificationItem[] {
  switch (action.type) {
    case 'add':
      return [...state, action.item]
    case 'patch':
      return state.map((item) => (item.id === action.id ? { ...item, ...action.patch, closing: false } : item))
    case 'close-start':
      return state.map((item) => (item.id === action.id ? { ...item, closing: true } : item))
    case 'remove':
      return state.filter((item) => item.id !== action.id)
    default:
      return state
  }
}

const NotificationContext = createContext<NotificationApi | null>(null)

/**
 * Provide toast notifications to the React tree
 * @param props Provider props
 * @returns Provider element
 */
export function NotificationProvider(props: { children: ReactNode }) {
  const { children } = props
  const [items, dispatch] = useReducer(notificationReducer, [])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const closeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /**
   * Clear auto-dismiss timer for a notification
   * @param id Notification id
   * @returns Nothing
   */
  const clearAutoTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  /**
   * Remove notification from state after exit animation
   * @param id Notification id
   * @returns Nothing
   */
  const finalizeClose = useCallback(
    (id: string) => {
      clearAutoTimer(id)
      const closeTimer = closeTimersRef.current.get(id)
      if (closeTimer) {
        clearTimeout(closeTimer)
        closeTimersRef.current.delete(id)
      }
      dispatch({ type: 'remove', id })
    },
    [clearAutoTimer]
  )

  /**
   * Begin closing animation then remove notification
   * @param id Notification id
   * @returns Nothing
   */
  const close = useCallback(
    (id: string) => {
      clearAutoTimer(id)
      dispatch({ type: 'close-start', id })
      const closeTimer = setTimeout(() => finalizeClose(id), NOTIFICATION_CLOSE_ANIMATION_MS)
      closeTimersRef.current.set(id, closeTimer)
    },
    [clearAutoTimer, finalizeClose]
  )

  /**
   * Schedule auto-dismiss when duration is positive
   * @param id Notification id
   * @param duration Duration in milliseconds
   * @returns Nothing
   */
  const scheduleAutoClose = useCallback(
    (id: string, duration: number) => {
      clearAutoTimer(id)
      if (duration <= 0) return
      const timer = setTimeout(() => close(id), duration)
      timersRef.current.set(id, timer)
    },
    [clearAutoTimer, close]
  )

  /**
   * Show a new notification
   * @param message Notification message
   * @param type Semantic type
   * @param duration Auto-dismiss duration
   * @param options Additional options
   * @returns Notification id
   */
  const show = useCallback(
    (message: string, type: NotificationType = 'info', duration?: number, options?: NotificationShowOptions): string => {
      const id = crypto.randomUUID()
      const resolvedDuration = resolveDuration(type, options?.duration ?? duration)
      const item: NotificationItem = {
        id,
        message,
        type,
        duration: resolvedDuration,
        progress: options?.progress,
        indeterminate: options?.indeterminate ?? (type === 'loading' && options?.progress == null),
      }
      dispatch({ type: 'add', item })
      scheduleAutoClose(id, resolvedDuration)
      return id
    },
    [scheduleAutoClose]
  )

  /**
   * Update an existing notification
   * @param id Notification id
   * @param updates Partial updates
   * @returns Nothing
   */
  const update = useCallback(
    (id: string, updates: NotificationUpdate) => {
      const patch: Partial<NotificationItem> = {}

      if (updates.message != null) patch.message = updates.message
      if (updates.progress != null) patch.progress = updates.progress
      if (updates.indeterminate != null) patch.indeterminate = updates.indeterminate

      if (updates.type != null) {
        patch.type = updates.type
        if (updates.type !== 'loading') {
          patch.progress = undefined
          patch.indeterminate = undefined
        }
      }

      dispatch({ type: 'patch', id, patch })

      if (updates.type && updates.type !== 'loading') {
        scheduleAutoClose(id, updates.duration ?? NOTIFICATION_DEFAULT_DURATION)
        return
      }

      if (updates.type === 'loading' || updates.duration === 0) {
        clearAutoTimer(id)
        return
      }

      if (updates.duration != null && updates.duration > 0) {
        scheduleAutoClose(id, updates.duration)
      }
    },
    [clearAutoTimer, scheduleAutoClose]
  )

  const info = useCallback((message: string, duration?: number) => show(message, 'info', duration), [show])
  const success = useCallback((message: string, duration?: number) => show(message, 'success', duration), [show])
  const error = useCallback((message: string, duration?: number) => show(message, 'error', duration), [show])
  const warn = useCallback((message: string, duration?: number) => show(message, 'warn', duration), [show])

  /**
   * Show a loading notification with helper methods
   * @param message Loading message
   * @param options Loading options
   * @returns Loading handle
   */
  const loading = useCallback(
    (message: string, options?: NotificationShowOptions): NotificationLoadingHandle => {
      const id = show(message, 'loading', 0, {
        indeterminate: options?.indeterminate ?? options?.progress == null,
        progress: options?.progress,
        duration: 0,
      })

      return {
        id,
        setProgress: (progress, nextMessage) => update(id, { type: 'loading', progress, message: nextMessage, indeterminate: false }),
        done: (nextMessage) => update(id, { type: 'success', message: nextMessage ?? message, duration: NOTIFICATION_DEFAULT_DURATION }),
        fail: (nextMessage) => update(id, { type: 'error', message: nextMessage ?? message, duration: NOTIFICATION_DEFAULT_DURATION }),
        close: () => close(id),
      }
    },
    [close, show, update]
  )

  const api = useMemo<NotificationApi>(() => ({ show, update, close, info, success, error, warn, loading }), [close, error, info, loading, show, success, update, warn])

  useEffect(() => {
    bindNotificationApi(api)
    return () => bindNotificationApi(null)
  }, [api])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      closeTimersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <NotificationViewport items={items} onClose={close} />
    </NotificationContext.Provider>
  )
}

/**
 * Access the notification API from React components
 * @returns Notification API
 */
export function useNotification(): NotificationApi {
  const api = useContext(NotificationContext)
  if (!api) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return api
}
