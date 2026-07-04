'use client'

/**
 * React context wiring the Studio store to the component tree
 */
import { createContext, type ReactNode, useContext } from 'react'

import { type StudioStore, useStudioStore } from '../hooks/useStudioStore'

const StudioContext = createContext<StudioStore | null>(null)

/**
 * Provide the Studio store to descendant components
 * @param children Child nodes
 * @returns Context provider element
 */
export function StudioProvider({ children }: { children: ReactNode }) {
  const store = useStudioStore()
  return <StudioContext.Provider value={store}>{children}</StudioContext.Provider>
}

/**
 * Access the Studio store from context
 * @returns The shared Studio store
 */
export function useStudio(): StudioStore {
  const ctx = useContext(StudioContext)
  if (!ctx) {
    throw new Error('useStudio must be used within a StudioProvider')
  }
  return ctx
}
