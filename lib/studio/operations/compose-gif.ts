/**
 * GIF composition operation: sort frame assets -> decode -> gifenc merge
 */
import { getMergedGifFilename, mergeFramesToGif } from '@/app/frames/core/gif-merge'
import { blobToImage, createImageDataFromImage } from '@/lib/image/canvas'

import type { StudioAsset, StudioAssetInput } from '../types'

/** GIF encoding settings */
export interface ComposeGifConfig {
  /** Delay between frames in milliseconds */
  intervalMs: number
  /** Whether the animation loops */
  loop: boolean
}

/**
 * Sort frame assets by timestamp metadata for correct playback order
 * @param assets Frame or image assets to sort
 * @returns Assets sorted by meta.timestampMs ascending
 */
export function sortFrameAssets(assets: StudioAsset[]): StudioAsset[] {
  return [...assets].sort((a, b) => {
    const ta = (a.meta?.timestampMs as number) ?? 0
    const tb = (b.meta?.timestampMs as number) ?? 0
    return ta - tb
  })
}

/**
 * Compose selected frame assets into a single animated GIF asset input
 * @param frames Frame assets (sorted internally by timestamp)
 * @param config GIF encoding settings
 * @param parentVideoName Optional parent video name for output filename
 * @returns GIF asset input ready for persistence
 */
export async function composeGifFromFrames(frames: StudioAsset[], config: ComposeGifConfig, parentVideoName?: string): Promise<StudioAssetInput> {
  const sorted = sortFrameAssets(frames)

  const extractedFrames = await Promise.all(
    sorted.map(async (asset, index) => {
      const img = await blobToImage(asset.blob)
      const imageData = createImageDataFromImage(img)
      return {
        id: asset.id,
        timestamp: (asset.meta?.timestampMs as number) ?? index,
        index,
        imageData,
        image: img,
      }
    })
  )

  const blob = mergeFramesToGif(extractedFrames, { intervalMs: config.intervalMs, loop: config.loop })
  const name = parentVideoName ? getMergedGifFilename(parentVideoName) : 'merged.gif'

  return {
    name,
    kind: 'gif',
    source: 'gif',
    mimeType: 'image/gif',
    blob,
    width: extractedFrames[0].imageData.width,
    height: extractedFrames[0].imageData.height,
    size: blob.size,
    parentId: sorted[0]?.parentId,
    meta: { frameCount: sorted.length, intervalMs: config.intervalMs },
  }
}
