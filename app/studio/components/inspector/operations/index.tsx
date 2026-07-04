'use client'

/**
 * Inspector operation panel router
 */
import type { StudioOperationTab } from '../../../hooks/studio-types'
import { ComposeGifOp } from './ComposeGifOp'
import { ComposeSpriteOp } from './ComposeSpriteOp'
import { ConvertFormatOp } from './ConvertFormatOp'
import { ExportOp } from './ExportOp'
import { ExtractFramesOp } from './ExtractFramesOp'
import { RemoveBackgroundOp } from './RemoveBackgroundOp'

/** Tab id to operation panel component */
const TAB_PANELS: Record<StudioOperationTab, () => React.ReactNode> = {
  'remove-background': RemoveBackgroundOp,
  'convert-format': ConvertFormatOp,
  'extract-frames': ExtractFramesOp,
  'compose-gif': ComposeGifOp,
  'compose-sprite': ComposeSpriteOp,
  export: ExportOp,
}

/**
 * Render the active inspector operation panel
 * @param tab Active tab id
 * @returns Panel element
 */
export function OperationPanel({ tab }: { tab: StudioOperationTab }) {
  const Panel = TAB_PANELS[tab]
  return Panel ? <Panel /> : null
}
