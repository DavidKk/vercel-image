/**
 * Studio preview toolbar operation tabs
 */
import type { ComponentType } from 'react'
import { FiDownload, FiFilm, FiGrid, FiRepeat, FiScissors } from 'react-icons/fi'
import { MdOutlineGif } from 'react-icons/md'

import { isStaticImageAsset } from '@/lib/studio/asset-helpers'
import type { StudioAsset } from '@/lib/studio/types'

import type { StudioOperationTab } from '../../hooks/studio-types'

/** Operation tab metadata for the floating preview toolbar */
export interface OperationTabItem {
  /** Operation tab id */
  value: StudioOperationTab
  /** Short label for the inspector panel header */
  label: string
  /** Descriptive tooltip for the preview toolbar icon */
  tooltip: string
  /** Toolbar icon */
  Icon: ComponentType<{ className?: string }>
}

/** Operation tab metadata for preview toolbar */
export const OPERATION_TABS: OperationTabItem[] = [
  {
    value: 'remove-background',
    label: 'Remove BG',
    tooltip: 'Remove background from selected images or GIFs',
    Icon: FiScissors,
  },
  {
    value: 'convert-format',
    label: 'Convert',
    tooltip: 'Convert selected images to PNG, JPEG, or WebP',
    Icon: FiRepeat,
  },
  {
    value: 'extract-frames',
    label: 'Extract frames',
    tooltip: 'Extract still frames from the selected video',
    Icon: FiFilm,
  },
  {
    value: 'compose-gif',
    label: 'Compose GIF',
    tooltip: 'Merge selected frames into an animated GIF',
    Icon: MdOutlineGif,
  },
  {
    value: 'compose-sprite',
    label: 'Compose sprite',
    tooltip: 'Arrange selected frames into a sprite sheet',
    Icon: FiGrid,
  },
  {
    value: 'export',
    label: 'Export',
    tooltip: 'Download selected assets as a ZIP file',
    Icon: FiDownload,
  },
]

/**
 * Count selected assets that can be merged into a GIF
 * @param selectedAssets Currently selected library assets
 * @returns Number of frame or static image sources
 */
function countGifComposeSources(selectedAssets: StudioAsset[]): number {
  return selectedAssets.filter((asset) => asset.source === 'frame' || isStaticImageAsset(asset)).length
}

/**
 * Operation tabs visible for the current selection
 * @param selectedAssets Currently selected library assets
 * @returns Toolbar tabs to render
 */
export function getVisibleOperationTabs(selectedAssets: StudioAsset[]): OperationTabItem[] {
  const hasVideoSelected = selectedAssets.some((asset) => asset.kind === 'video')
  const canComposeGif = countGifComposeSources(selectedAssets) >= 2

  return OPERATION_TABS.filter((tab) => {
    if (tab.value === 'extract-frames') return hasVideoSelected
    if (tab.value === 'compose-gif') return canComposeGif
    return true
  })
}
