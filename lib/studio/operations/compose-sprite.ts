/**
 * Sprite sheet composition operation: sort frames -> grid layout -> PNG blob
 */
import { blobToImage, createImageDataFromImage } from '@/lib/image/canvas'

import { getSpriteFilename, mergeFramesToSprite, type SpriteMergeOptions } from '../sprite-merge'
import type { StudioAsset, StudioAssetInput } from '../types'
import { sortFrameAssets } from './compose-gif'

/**
 * Compose selected frame assets into a single sprite sheet PNG asset input
 * @param frames Image assets to arrange in a grid
 * @param config Sprite layout settings (columns, padding)
 * @returns Sprite sheet asset input ready for persistence
 */
export async function composeSpriteFromFrames(frames: StudioAsset[], config: SpriteMergeOptions): Promise<StudioAssetInput> {
  const sorted = sortFrameAssets(frames)

  const imageDataList = await Promise.all(
    sorted.map(async (asset) => {
      const img = await blobToImage(asset.blob)
      return createImageDataFromImage(img)
    })
  )

  const result = await mergeFramesToSprite(imageDataList, config)
  const baseName = sorted[0]?.name.replace(/\.[^.]+$/, '').replace(/-frame-\d+ms$/, '') ?? 'sprite'

  return {
    name: getSpriteFilename(baseName),
    kind: 'sprite',
    source: 'sprite',
    mimeType: 'image/png',
    blob: result.blob,
    width: result.width,
    height: result.height,
    size: result.blob.size,
    parentId: sorted[0]?.parentId,
    meta: { frameCount: sorted.length, columns: config.columns, frames: result.frames },
  }
}
