/**
 * GIF background removal: decode frames -> AI per frame -> re-encode GIF
 */
import { mergeFramesToGif } from '@/app/frames/core/gif-merge'
import type { ExtractedFrame } from '@/app/frames/core/types'
import type { BackgroundRemovalUserConfig } from '@/app/progress/core/model-config'
import { getProcessingModeLabel } from '@/app/progress/core/model-config'
import { processImage } from '@/app/progress/core/segmentation-worker'
import { decodeGifBlob } from '@/lib/image/gif-decode'

import type { StudioAsset, StudioAssetInput } from '../types'

/** Result of processing a single GIF asset */
export interface ProcessGifBackgroundItemResult {
  /** Source asset id */
  assetId: string
  /** Output GIF asset input when successful */
  output?: StudioAssetInput
  /** Error message when failed */
  error?: string
}

/**
 * Build output filename suffix from processing mode
 * @param mode Processing mode
 * @returns Filename suffix token
 */
function getModeSuffix(mode: BackgroundRemovalUserConfig['mode']): string {
  switch (mode) {
    case 'removeForeground':
      return 'no-fg'
    case 'segmentForeground':
      return 'mask'
    default:
      return 'nobg'
  }
}

/**
 * Process one GIF asset frame-by-frame and merge into a new animated GIF
 * @param asset Source GIF asset
 * @param config Background removal configuration
 * @param onFrameProgress Called after each processed frame
 * @returns Processing result with output asset input or error
 */
export async function processGifRemoveBackgroundItem(
  asset: StudioAsset,
  config: BackgroundRemovalUserConfig,
  onFrameProgress?: (frameCurrent: number, frameTotal: number) => void
): Promise<ProcessGifBackgroundItemResult> {
  try {
    const decoded = await decodeGifBlob(asset.blob)
    const processedFrames: ExtractedFrame[] = []
    const delaysMs: number[] = []

    for (let index = 0; index < decoded.frames.length; index++) {
      onFrameProgress?.(index + 1, decoded.frames.length)
      const frame = decoded.frames[index]
      const result = await processImage(frame.imageData, config)

      if (!result) {
        return { assetId: asset.id, error: `Frame ${index + 1} returned no result` }
      }

      processedFrames.push({
        id: `${asset.id}-f${index}`,
        timestamp: index,
        index,
        imageData: result,
        image: document.createElement('img'),
      })
      delaysMs.push(frame.delayMs)
    }

    const blob = mergeFramesToGif(processedFrames, {
      intervalMs: delaysMs[0] ?? 100,
      delaysMs,
      loop: decoded.loop,
      transparent: true,
    })

    const baseName = asset.name.replace(/\.[^.]+$/, '')
    const suffix = getModeSuffix(config.mode)

    return {
      assetId: asset.id,
      output: {
        name: `${baseName}-${suffix}.gif`,
        kind: 'gif',
        source: 'background-removed',
        mimeType: 'image/gif',
        blob,
        width: decoded.width,
        height: decoded.height,
        size: blob.size,
        parentId: asset.id,
        meta: {
          frameCount: decoded.frames.length,
          mode: config.mode,
          modeLabel: getProcessingModeLabel(config.mode),
        },
      },
    }
  } catch (err) {
    return {
      assetId: asset.id,
      error: err instanceof Error ? err.message : 'GIF processing failed',
    }
  }
}

/**
 * Process multiple GIF assets sequentially
 * @param assets GIF assets to process
 * @param config Background removal configuration
 * @param onFrameProgress Called after each processed frame across all GIFs
 * @returns Per-item processing results
 */
export async function processGifRemoveBackgroundBatch(
  assets: StudioAsset[],
  config: BackgroundRemovalUserConfig,
  onFrameProgress?: (assetIndex: number, assetTotal: number, frameCurrent: number, frameTotal: number) => void
): Promise<ProcessGifBackgroundItemResult[]> {
  const results: ProcessGifBackgroundItemResult[] = []

  for (let assetIndex = 0; assetIndex < assets.length; assetIndex++) {
    const asset = assets[assetIndex]
    const result = await processGifRemoveBackgroundItem(asset, config, (frameCurrent, frameTotal) => {
      onFrameProgress?.(assetIndex + 1, assets.length, frameCurrent, frameTotal)
    })
    results.push(result)
  }

  return results
}
