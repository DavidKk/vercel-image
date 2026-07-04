/**
 * Animated GIF decoding utilities (browser-only)
 */
import { decompressFrames, type ParsedGif, parseGIF } from 'gifuct-js'

/** A single decoded GIF frame with timing metadata */
export interface DecodedGifFrame {
  /** Frame index in playback order */
  index: number
  /** Frame pixel data at full canvas size */
  imageData: ImageData
  /** Delay before the next frame in milliseconds */
  delayMs: number
}

/** Result of decoding an animated GIF blob */
export interface DecodedGif {
  /** Canvas width in pixels */
  width: number
  /** Canvas height in pixels */
  height: number
  /** Decoded frames in order */
  frames: DecodedGifFrame[]
  /** Whether the animation should loop forever */
  loop: boolean
}

/**
 * Read NETSCAPE loop extension from a parsed GIF
 * @param parsedGif Parsed GIF structure
 * @returns True when the animation loops indefinitely
 */
function readGifLoopsForever(parsedGif: ParsedGif): boolean {
  for (const block of parsedGif.frames) {
    if (!('application' in block)) continue
    if (block.application.id !== 'NETSCAPE2.0') continue
    const blocks = block.application.blocks
    if (blocks.length < 3) continue
    const loopCount = blocks[1] | (blocks[2] << 8)
    return loopCount === 0
  }
  return true
}

/**
 * Decode an animated GIF blob into RGBA frames with per-frame delays
 * @param blob Source GIF blob
 * @returns Decoded GIF metadata and frames
 */
export async function decodeGifBlob(blob: Blob): Promise<DecodedGif> {
  const buffer = await blob.arrayBuffer()
  const parsed = parseGIF(buffer)
  const width = parsed.lsd.width
  const height = parsed.lsd.height

  if (width <= 0 || height <= 0) {
    throw new Error('Invalid GIF dimensions')
  }

  const rawFrames = decompressFrames(parsed, true)
  if (rawFrames.length === 0) {
    throw new Error('GIF contains no frames')
  }

  const frames = rawFrames.map((frame, index) => {
    if (frame.dims.width !== width || frame.dims.height !== height) {
      throw new Error('GIF frames must share the same canvas size')
    }

    const delayMs = Math.max(20, frame.delay * 10)
    return {
      index,
      delayMs,
      imageData: new ImageData(new Uint8ClampedArray(frame.patch), width, height),
    }
  })

  return {
    width,
    height,
    frames,
    loop: readGifLoopsForever(parsed),
  }
}
