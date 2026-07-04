/**
 * Background removal operation: blob -> ImageData -> AI worker -> output blob
 */
import type { BackgroundRemovalUserConfig } from '@/app/progress/core/model-config'
import { getOutputExtension } from '@/app/progress/core/model-config'
import { processImage } from '@/app/progress/core/segmentation-worker'
import { blobToImage, canvasToBlob, createCanvasFromImageData, createImageDataFromImage } from '@/lib/image/canvas'

import type { StudioAsset, StudioAssetInput } from '../types'

/** Result of processing a single asset */
export interface RemoveBackgroundItemResult {
  /** Source asset id */
  assetId: string
  /** Output asset input when successful */
  output?: StudioAssetInput
  /** Error message when failed */
  error?: string
}

/**
 * Process one image asset through the segmentation worker
 * Pipeline: blob -> HTMLImageElement -> ImageData -> worker -> canvas -> blob
 * @param asset Source image asset
 * @param config Background removal configuration
 * @returns Processing result with output asset input or error
 */
export async function processRemoveBackgroundItem(asset: StudioAsset, config: BackgroundRemovalUserConfig): Promise<RemoveBackgroundItemResult> {
  try {
    const img = await blobToImage(asset.blob)
    const imageData = createImageDataFromImage(img)
    const result = await processImage(imageData, config)

    if (!result) {
      return { assetId: asset.id, error: 'Segmentation returned no result' }
    }

    const canvas = createCanvasFromImageData(result)
    const mimeType = config.outputFormat === 'image/jpeg' || config.outputFormat === 'image/webp' ? config.outputFormat : 'image/png'
    const quality = mimeType === 'image/png' ? undefined : config.outputQuality
    const blob = await canvasToBlob(canvas, mimeType, quality)
    const ext = getOutputExtension(config.outputFormat)
    const baseName = asset.name.replace(/\.[^.]+$/, '')

    return {
      assetId: asset.id,
      output: {
        name: `${baseName}-nobg.${ext}`,
        kind: 'image',
        source: 'background-removed',
        mimeType,
        blob,
        width: result.width,
        height: result.height,
        size: blob.size,
        parentId: asset.id,
      },
    }
  } catch (err) {
    return {
      assetId: asset.id,
      error: err instanceof Error ? err.message : 'Processing failed',
    }
  }
}

/**
 * Process multiple image assets sequentially (single worker model constraint)
 * @param assets Image assets to process
 * @param config Background removal configuration
 * @param onProgress Called after each item with index and total
 * @returns All per-item results
 */
export async function processRemoveBackgroundBatch(
  assets: StudioAsset[],
  config: BackgroundRemovalUserConfig,
  onProgress?: (current: number, total: number) => void
): Promise<RemoveBackgroundItemResult[]> {
  const results: RemoveBackgroundItemResult[] = []
  for (let i = 0; i < assets.length; i++) {
    onProgress?.(i + 1, assets.length)
    const result = await processRemoveBackgroundItem(assets[i], config)
    results.push(result)
  }
  return results
}
