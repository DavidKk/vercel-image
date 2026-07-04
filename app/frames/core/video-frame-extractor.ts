import { canvasToBlob } from '@/lib/image/canvas'

import { computeScaledSize } from './frame-scheduler'
import type { ExtractedFrame, ExtractionProgress, VideoSource } from './types'

/**
 * Seek video to a specific timestamp
 * @param video HTML video element
 * @param timeMs Target time in milliseconds
 * @returns Promise resolved when seek completes
 */
function seekVideo(video: HTMLVideoElement, timeMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeTime = Math.min(Math.max(0, timeMs / 1000), Math.max(0, video.duration - 0.001))

    const onSeeked = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      reject(new Error(`Failed to seek video to ${safeTime}s`))
    }

    function cleanup() {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }

    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)
    video.currentTime = safeTime
  })
}

/**
 * Capture the current video frame as ImageData
 * @param video HTML video element
 * @param width Output width
 * @param height Output height
 * @returns Captured frame pixels
 */
function captureFrame(video: HTMLVideoElement, width: number, height: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }
  ctx.drawImage(video, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/**
 * Capture a single video frame as an encoded image blob
 * @param source Loaded video source
 * @param timeMs Timestamp in milliseconds
 * @param maxDimension Max output dimension (0 = native)
 * @returns Encoded frame blob
 */
export async function captureVideoFrameBlob(source: VideoSource, timeMs = 0, maxDimension = 512): Promise<Blob> {
  const { width, height } = computeScaledSize(source.width, source.height, maxDimension)
  await seekVideo(source.video, timeMs)
  const imageData = captureFrame(source.video, width, height)
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }
  ctx.putImageData(imageData, 0, 0)
  return canvasToBlob(canvas, 'image/webp', 0.85)
}

/**
 * Create a preview image from ImageData
 * @param imageData Frame pixels
 * @returns Loaded HTML image element
 */
function imageDataToImage(imageData: ImageData): Promise<HTMLImageElement> {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Promise.reject(new Error('Failed to create canvas context'))
  }
  ctx.putImageData(imageData, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode frame preview'))
          return
        }
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load frame preview'))
        img.src = url
      },
      'image/webp',
      0.85
    )
  })
}

/**
 * Load a video file into a video element
 * @param file Video file
 * @returns Video source metadata
 */
export async function loadVideoFile(file: File): Promise<VideoSource> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Failed to load video metadata'))
  })

  return {
    file,
    url,
    video,
    duration: video.duration,
    width: video.videoWidth,
    height: video.videoHeight,
  }
}

/**
 * Release resources held by a video source
 * @param source Video source to dispose
 */
export function disposeVideoSource(source: VideoSource): void {
  source.video.pause()
  source.video.removeAttribute('src')
  source.video.load()
  URL.revokeObjectURL(source.url)
}

/**
 * Extract frames from a video at given timestamps
 * @param source Loaded video source
 * @param timestamps Milliseconds to capture
 * @param maxDimension Max output dimension (0 = native)
 * @param onProgress Optional progress callback
 * @returns Extracted frames in order
 */
export async function extractVideoFrames(
  source: VideoSource,
  timestamps: number[],
  maxDimension: number,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractedFrame[]> {
  const { width, height } = computeScaledSize(source.width, source.height, maxDimension)
  const frames: ExtractedFrame[] = []

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i]
    onProgress?.({
      current: i + 1,
      total: timestamps.length,
      status: `Extracting frame ${i + 1}/${timestamps.length} at ${timestamp}ms`,
    })

    await seekVideo(source.video, timestamp)
    const imageData = captureFrame(source.video, width, height)
    const image = await imageDataToImage(imageData)

    frames.push({
      id: crypto.randomUUID(),
      timestamp,
      index: i,
      imageData,
      image,
    })
  }

  return frames
}

/**
 * Dispose preview images and free object URLs
 * @param frames Frames to clean up
 */
export function disposeExtractedFrames(frames: ExtractedFrame[]): void {
  for (const frame of frames) {
    if (frame.image.src.startsWith('blob:')) {
      URL.revokeObjectURL(frame.image.src)
    }
  }
}
