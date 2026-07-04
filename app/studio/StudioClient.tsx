'use client'

/**
 * Studio editor shell with page-level file drop
 */
import { useCallback, useState } from 'react'

import { ConfirmDialogProvider } from '@/components/confirm-dialog'
import { NotificationProvider } from '@/components/notification'

import { CanvasArea } from './components/canvas/CanvasArea'
import { InspectorPanel } from './components/inspector/InspectorPanel'
import { LibraryPanel } from './components/library/LibraryPanel'
import { QueueBar } from './components/timeline/QueueBar'
import { TopBar } from './components/top-bar/TopBar'
import { StudioProvider } from './context/StudioContext'
import { useStudioFileImport } from './hooks/useStudioFileImport'

/**
 * Inner layout with global drag-drop import
 * @returns Editor layout element
 */
function StudioLayout() {
  const { importFromFiles } = useStudioFileImport()
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      await importFromFiles(event.dataTransfer.files, 'any')
    },
    [importFromFiles]
  )

  return (
    <div
      data-studio-theme="pro"
      className="studio-root relative flex h-full min-h-0 flex-col overflow-hidden bg-[var(--studio-workspace-bg)]"
      onDrop={(event) => void handleDrop(event)}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setIsDragging(false)
      }}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center border-2 border-dashed border-[var(--studio-accent)] bg-[var(--studio-accent-muted)]">
          <span className="rounded-full bg-[var(--studio-surface-bg)]/90 px-4 py-2 text-sm font-medium text-[var(--studio-accent-hover)] shadow-studio-sm">
            Drop images or videos to import
          </span>
        </div>
      )}

      <TopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LibraryPanel />
        <CanvasArea />
        <InspectorPanel />
      </div>
      <QueueBar />
    </div>
  )
}

/**
 * Studio client root component
 * @returns Full-screen editor
 */
export function StudioClient() {
  return (
    <NotificationProvider>
      <ConfirmDialogProvider>
        <StudioProvider>
          <StudioLayout />
        </StudioProvider>
      </ConfirmDialogProvider>
    </NotificationProvider>
  )
}
