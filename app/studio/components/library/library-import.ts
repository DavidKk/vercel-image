/**
 * Library import rules keyed by the active kind filter
 */
import type { ComponentType } from 'react'
import { FiImage, FiVideo } from 'react-icons/fi'

import type { LibraryImageOriginFilter, LibraryKindFilter } from '../../hooks/studio-url-query'

/** Import configuration for a library kind filter */
export interface LibraryImportConfig {
  /** Whether the header import action is available */
  canImport: boolean
  /** File input accept attribute */
  accept: string
  /** Tooltip for the import button */
  tooltip: string
  /** Accessible label for the import button */
  ariaLabel: string
  /** Header import icon */
  Icon: ComponentType<{ className?: string }>
  /** Empty grid hint */
  emptyHint: string
  /** MIME prefix used to filter dropped or picked files */
  mimePrefix: 'image/' | 'video/' | 'image/gif' | null
}

/**
 * Resolve library import settings for the active kind filter
 * @param kindFilter Active library kind filter
 * @param imageOriginFilter Active image origin filter when kind is image
 * @returns Import configuration for the filter
 */
export function getLibraryImportConfig(kindFilter: LibraryKindFilter, imageOriginFilter: LibraryImageOriginFilter = 'original'): LibraryImportConfig {
  switch (kindFilter) {
    case 'image':
      if (imageOriginFilter === 'generated') {
        return {
          canImport: false,
          accept: '',
          tooltip: '',
          ariaLabel: '',
          Icon: FiImage,
          emptyHint: 'Processed images appear here after running operations',
          mimePrefix: null,
        }
      }
      return {
        canImport: true,
        accept: 'image/*',
        tooltip: 'Import images',
        ariaLabel: 'Import images',
        Icon: FiImage,
        emptyHint: 'Drop original images here or use Import',
        mimePrefix: 'image/',
      }
    case 'video':
      return {
        canImport: true,
        accept: 'video/*',
        tooltip: 'Import videos',
        ariaLabel: 'Import videos',
        Icon: FiVideo,
        emptyHint: 'Drop videos here or use Import',
        mimePrefix: 'video/',
      }
    case 'gif':
      return {
        canImport: true,
        accept: 'image/gif',
        tooltip: 'Import GIF',
        ariaLabel: 'Import GIF',
        Icon: FiImage,
        emptyHint: 'Drop GIF files here or use Import',
        mimePrefix: 'image/gif',
      }
    case 'sprite':
      return {
        canImport: false,
        accept: '',
        tooltip: '',
        ariaLabel: '',
        Icon: FiImage,
        emptyHint: 'Sprite sheets are created from selected images',
        mimePrefix: null,
      }
    default:
      return {
        canImport: false,
        accept: '',
        tooltip: '',
        ariaLabel: '',
        Icon: FiImage,
        emptyHint: 'Switch to Images or Videos to import files',
        mimePrefix: null,
      }
  }
}
