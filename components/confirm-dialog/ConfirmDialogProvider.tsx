'use client'

/**
 * Global confirm dialog provider
 */
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

import { ConfirmDialog } from './ConfirmDialog'
import type { ConfirmApi, ConfirmOptions, ConfirmRequest } from './types'

const ConfirmContext = createContext<ConfirmApi | null>(null)

interface ConfirmDialogProviderProps {
  /** App subtree */
  children: ReactNode
}

/**
 * Provide a global confirm dialog API to descendants
 * @param props Provider props
 * @returns Provider element
 */
export function ConfirmDialogProvider(props: ConfirmDialogProviderProps) {
  const { children } = props
  const [request, setRequest] = useState<ConfirmRequest | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ options, resolve })
    })
  }, [])

  const close = useCallback((confirmed: boolean) => {
    setRequest((current) => {
      current?.resolve(confirmed)
      return null
    })
  }, [])

  const api = useMemo<ConfirmApi>(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <ConfirmDialog open={request != null} options={request?.options ?? { message: '' }} onCancel={() => close(false)} onConfirm={() => close(true)} />
    </ConfirmContext.Provider>
  )
}

/**
 * Access the confirm dialog API from React components
 * @returns Confirm API instance
 */
export function useConfirm(): ConfirmApi {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider')
  }
  return context
}
