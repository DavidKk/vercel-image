/**
 * Sprite sheet generation from image frames
 */
import { canvasToBlob, createCanvasFromImageData } from '@/lib/image/canvas'

/** Sprite sheet layout options */
export interface SpriteMergeOptions {
  /** Number of columns in the grid */
  columns: number
  /** Padding between cells in pixels */
  padding: number
}

/** Result of sprite sheet generation */
export interface SpriteMergeResult {
  /** Combined sprite sheet blob */
  blob: Blob
  /** Sprite sheet width */
  width: number
  /** Sprite sheet height */
  height: number
  /** Frame metadata for JSON export */
  frames: { index: number; x: number; y: number; width: number; height: number }[]
}

/**
 * Merge frame ImageData into a single sprite sheet
 * @param frames Array of frame pixel data (must be same size)
 * @param options Layout options
 * @returns Sprite sheet blob and frame metadata
 */
export async function mergeFramesToSprite(frames: ImageData[], options: SpriteMergeOptions): Promise<SpriteMergeResult> {
  if (frames.length === 0) {
    throw new Error('No frames to merge')
  }

  const { columns, padding } = options
  const frameWidth = frames[0].width
  const frameHeight = frames[0].height
  const rows = Math.ceil(frames.length / columns)
  const sheetWidth = columns * frameWidth + (columns - 1) * padding
  const sheetHeight = rows * frameHeight + (rows - 1) * padding

  const canvas = document.createElement('canvas')
  canvas.width = sheetWidth
  canvas.height = sheetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create canvas context')

  ctx.fillStyle = 'transparent'
  ctx.clearRect(0, 0, sheetWidth, sheetHeight)

  const frameMeta: SpriteMergeResult['frames'] = []

  for (let i = 0; i < frames.length; i++) {
    const col = i % columns
    const row = Math.floor(i / columns)
    const x = col * (frameWidth + padding)
    const y = row * (frameHeight + padding)

    const frameCanvas = createCanvasFromImageData(frames[i])
    ctx.drawImage(frameCanvas, x, y)
    frameMeta.push({ index: i, x, y, width: frameWidth, height: frameHeight })
  }

  const blob = await canvasToBlob(canvas, 'image/png')
  return { blob, width: sheetWidth, height: sheetHeight, frames: frameMeta }
}

/**
 * Build default sprite sheet filename
 * @param baseName Source name without extension
 * @returns Sprite sheet filename
 */
export function getSpriteFilename(baseName: string): string {
  return `${baseName}-sprite.png`
}
