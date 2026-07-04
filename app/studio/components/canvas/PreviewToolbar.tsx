'use client'

/**
 * Floating operation navigation toolbar overlaid on the preview area.
 * Semi-transparent by default; becomes more opaque when hovering the bottom preview zone.
 * Selecting an icon switches the active operation; configuration runs in the Inspector.
 */
import { useEffect } from 'react'

import { Tooltip } from '@/components/Tooltip'

import { useStudio } from '../../context/StudioContext'
import { getVisibleOperationTabs } from './operation-tabs'

/**
 * Operation navigation toolbar floating over the preview area
 * @returns Preview toolbar element
 */
export function PreviewToolbar() {
  const { activeTab, setActiveTab, selectedAssets } = useStudio()
  const visibleTabs = getVisibleOperationTabs(selectedAssets)

  useEffect(() => {
    const visibleTabValues = new Set(getVisibleOperationTabs(selectedAssets).map((tab) => tab.value))
    if (!visibleTabValues.has(activeTab)) {
      setActiveTab('remove-background')
    }
  }, [activeTab, selectedAssets, setActiveTab])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20">
      <div className="group/toolbar pointer-events-auto mx-auto flex max-w-full justify-center px-3 pb-1 pt-14">
        <div
          className={[
            'flex items-center gap-1 rounded-full border border-black/5 p-1 shadow-md backdrop-blur-md',
            'bg-white/35 opacity-50 transition-all duration-200',
            'group-hover/toolbar:opacity-100 group-hover/toolbar:bg-white/80 group-hover/toolbar:shadow-lg',
            'hover:opacity-100 hover:bg-white/80 hover:shadow-lg',
            'focus-within:opacity-100 focus-within:bg-white/80 focus-within:shadow-lg',
          ].join(' ')}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <Tooltip key={tab.value} content={tab.tooltip}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  aria-label={tab.tooltip}
                  aria-pressed={isActive}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? 'bg-[var(--studio-accent)] text-[var(--studio-accent-fg)] shadow-studio-sm'
                      : 'text-[var(--studio-surface-fg-muted)] hover:bg-[var(--studio-surface-muted)] hover:text-[var(--studio-surface-fg)]'
                  }`}
                >
                  <tab.Icon className="h-4 w-4" />
                </button>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}
