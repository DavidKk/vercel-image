/**
 * Format conversion operation: decode blob -> canvas -> re-encode as target MIME
 */
import { blobToImage, canvasToBlob } from '@/lib/image/canvas'

import type { StudioAsset, StudioAssetInput } from '../types'

/** Conversion target settings */
export interface ConvertFormatConfig {
  /** Target MIME type */
  format: 'image/png' | 'image/jpeg' | 'image/webp'
  /** Quality for lossy formats */
  quality: number
}

/**
 * Convert a single image asset to the target format
 * @param asset Source image asset
 * @param config Conversion settings
 * @returns Output asset input
 */
export async function convertFormatItem(asset: StudioAsset, config: ConvertFormatConfig): Promise<StudioAssetInput> {
  const img = await blobToImage(asset.blob)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }
  ctx.drawImage(img, 0, 0)
  const blob = await canvasToBlob(canvas, config.format, config.quality)
  const ext = config.format.split('/')[1]
  const baseName = asset.name.replace(/\.[^.]+$/, '')

  return {
    name: `${baseName}.${ext}`,
    kind: 'image',
    source: 'converted',
    mimeType: config.format,
    blob,
    width: canvas.width,
    height: canvas.height,
    size: blob.size,
    parentId: asset.id,
  }
}
