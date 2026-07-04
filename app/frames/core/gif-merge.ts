import { applyPalette, GIFEncoder, prequantize, quantize } from 'gifenc'

import type { ExtractedFrame } from './types'

/**
 * Options for merging frames into a GIF
 */
export interface GifMergeOptions {
  /** Default delay between frames in milliseconds when delaysMs is omitted */
  intervalMs: number
  /** Whether to repeat the animation forever */
  loop: boolean
  /** Optional per-frame delays in milliseconds (overrides intervalMs per frame) */
  delaysMs?: number[]
  /**
   * Force transparent GIF encoding (1-bit alpha per frame).
   * When omitted, transparency is auto-detected from frame alpha channels.
   */
  transparent?: boolean
}

/** Alpha threshold for GIF 1-bit transparency */
const GIF_ALPHA_THRESHOLD = 128

/**
 * Convert ImageData RGBA to a flat Uint8Array for gifenc
 * @param imageData Source image data
 * @returns Flat RGBA byte array
 */
function imageDataToRgba(imageData: ImageData): Uint8Array {
  return new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength)
}

/**
 * Copy ImageData RGBA so gifenc pre-quantization can mutate pixels in place
 * @param imageData Source image data
 * @returns Mutable RGBA copy
 */
function copyImageDataRgba(imageData: ImageData): Uint8Array {
  return new Uint8Array(imageData.data)
}

/**
 * Check whether RGBA data contains pixels below the GIF transparency threshold
 * @param rgba Flat RGBA byte array
 * @returns True when any pixel should be treated as transparent
 */
function hasTransparentPixels(rgba: Uint8Array): boolean {
  for (let index = 3; index < rgba.length; index += 4) {
    if (rgba[index] < GIF_ALPHA_THRESHOLD) return true
  }
  return false
}

/**
 * Find the palette index that represents fully transparent pixels
 * @param palette Quantized RGBA palette entries
 * @returns Palette index for transparency, or 0 when none found
 */
function findTransparentPaletteIndex(palette: number[][]): number {
  const index = palette.findIndex((color) => (color[3] ?? 255) === 0)
  return index >= 0 ? index : 0
}

/**
 * Determine whether the GIF should use 1-bit transparency encoding
 * @param frames Source frames
 * @param options Merge options
 * @returns True when transparent encoding should be used
 */
function shouldEncodeWithTransparency(frames: ExtractedFrame[], options: GifMergeOptions): boolean {
  if (options.transparent != null) return options.transparent
  return frames.some((frame) => hasTransparentPixels(imageDataToRgba(frame.imageData)))
}

/**
 * Encode one GIF frame with optional 1-bit transparency
 * @param gif GIF encoder instance
 * @param imageData Frame pixel data
 * @param width Frame width in pixels
 * @param height Frame height in pixels
 * @param delayCentiseconds Frame delay in centiseconds
 * @param frameIndex Zero-based frame index in the sequence
 * @param useTransparency Whether to apply 1-bit transparency
 * @param loop Whether the animation should loop forever
 * @returns Nothing
 */
function writeGifFrame(
  gif: ReturnType<typeof GIFEncoder>,
  imageData: ImageData,
  width: number,
  height: number,
  delayCentiseconds: number,
  frameIndex: number,
  useTransparency: boolean,
  loop: boolean
): void {
  const firstFrameOptions = frameIndex === 0 ? { repeat: loop ? 0 : -1 } : {}

  if (!useTransparency) {
    const rgba = imageDataToRgba(imageData)
    const palette = quantize(rgba, 256, { format: 'rgba4444' })
    const paletteIndex = applyPalette(rgba, palette, 'rgba4444')
    gif.writeFrame(paletteIndex, width, height, {
      palette,
      delay: delayCentiseconds,
      ...firstFrameOptions,
    })
    return
  }

  const rgba = copyImageDataRgba(imageData)
  const uint32 = new Uint32Array(rgba.buffer)
  prequantize(uint32, { roundRGB: 1, oneBitAlpha: GIF_ALPHA_THRESHOLD })

  const palette = quantize(rgba, 256, {
    format: 'rgba4444',
    oneBitAlpha: GIF_ALPHA_THRESHOLD,
  })
  const transparentIndex = findTransparentPaletteIndex(palette)
  const hasTransparentColor = palette.some((color) => (color[3] ?? 255) === 0)
  const index = applyPalette(rgba, palette, 'rgba4444')

  gif.writeFrame(index, width, height, {
    palette,
    delay: delayCentiseconds,
    transparent: hasTransparentColor,
    transparentIndex,
    dispose: hasTransparentColor ? 2 : -1,
    ...firstFrameOptions,
  })
}

/**
 * Merge extracted frames into an animated GIF blob
 * @param frames Frames in playback order
 * @param options GIF encoding options
 * @returns Animated GIF blob
 */
export function mergeFramesToGif(frames: ExtractedFrame[], options: GifMergeOptions): Blob {
  if (frames.length === 0) {
    throw new Error('No frames to merge')
  }

  const { width, height } = frames[0].imageData
  const gif = GIFEncoder()
  const useTransparency = shouldEncodeWithTransparency(frames, options)

  for (let index = 0; index < frames.length; index++) {
    const frame = frames[index]
    if (frame.imageData.width !== width || frame.imageData.height !== height) {
      throw new Error('All frames must have the same dimensions')
    }

    const delayMs = options.delaysMs?.[index] ?? options.intervalMs
    const delayCentiseconds = Math.max(1, Math.round(delayMs / 10))

    writeGifFrame(gif, frame.imageData, width, height, delayCentiseconds, index, useTransparency, options.loop)
  }

  gif.finish()

  const bytes = gif.bytes()
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  return new Blob([buffer], { type: 'image/gif' })
}

/**
 * Build a default output filename for a merged GIF
 * @param sourceName Original video filename
 * @returns GIF filename
 */
export function getMergedGifFilename(sourceName: string): string {
  const baseName = sourceName.replace(/\.[^.]+$/, '')
  return `${baseName}-merged.gif`
}
