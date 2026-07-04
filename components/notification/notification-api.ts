/**
 * Module-level notification API binding for imperative calls
 */
import type { NotificationApi } from './types'

/** Bound notification API instance */
let notificationApi: NotificationApi | null = null

/**
 * Attach the live notification API from the provider
 * @param api Notification API or null on unmount
 * @returns Nothing
 */
export function bindNotificationApi(api: NotificationApi | null): void {
  notificationApi = api
}

/**
 * Get the bound notification API
 * @returns Notification API instance
 */
export function getNotificationApi(): NotificationApi {
  if (!notificationApi) {
    throw new Error('NotificationProvider is not mounted')
  }
  return notificationApi
}

/**
 * Show a notification via the bound API
 * @param message Notification message
 * @param type Semantic type
 * @param duration Auto-dismiss duration in milliseconds
 * @param options Additional show options
 * @returns Notification id
 */
export function notifyShow(message: string, type?: Parameters<NotificationApi['show']>[1], duration?: number, options?: Parameters<NotificationApi['show']>[3]): string {
  return getNotificationApi().show(message, type, duration, options)
}
