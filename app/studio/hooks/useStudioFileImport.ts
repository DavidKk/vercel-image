'use client'

/**
 * Shared Studio file import flow with toast feedback
 */
import { useCallback } from 'react'

import { useNotification } from '@/components/notification'
import { partitionImportFiles, type StudioImportScope, summarizeFileNames } from '@/lib/studio/import-files'

import { useStudio } from '../context/StudioContext'

/**
 * Hook for importing files into the library with notification feedback
 * @returns Import handler
 */
export function useStudioFileImport() {
  const { importFiles, isBusy } = useStudio()
  const notification = useNotification()

  /**
   * Import files from drag-drop or file picker
   * @param files File list to import
   * @param scope Allowed import scope
   * @returns Whether any files were imported
   */
  const importFromFiles = useCallback(
    async (files: FileList | File[] | null, scope: StudioImportScope): Promise<boolean> => {
      if (!files || Array.from(files).length === 0) return false

      if (isBusy) {
        notification.warn('Wait for the current task to finish')
        return false
      }

      const { supported, unsupportedType, wrongScope } = partitionImportFiles(files, scope)

      if (unsupportedType.length > 0) {
        notification.warn(`Unsupported file type: ${summarizeFileNames(unsupportedType)}`)
      }

      if (wrongScope.length > 0) {
        const hint =
          scope === 'image'
            ? 'Switch to Videos to import video files'
            : scope === 'video'
              ? 'Switch to Images to import image files'
              : scope === 'gif'
                ? 'Switch to GIF to import animated GIF files'
                : 'Only image and video files are supported'
        notification.info(`${hint}: ${summarizeFileNames(wrongScope)}`)
      }

      if (supported.length === 0) return false

      const loading = notification.loading('Importing files...', { indeterminate: true })

      try {
        const created = await importFiles(supported)
        if (created.length === 0) {
          loading.fail('No files were imported')
          return false
        }

        loading.done(`Imported ${created.length} asset${created.length === 1 ? '' : 's'}`)
        return true
      } catch {
        loading.fail('Import failed')
        return false
      }
    },
    [importFiles, isBusy, notification]
  )

  return { importFromFiles, isBusy }
}
