/**
 * Video frame extraction operation: seek video -> capture canvas -> persist as frame assets
 */
import { buildFrameTimestamps } from '@/app/frames/core/frame-scheduler'
import { resolveTimeRange } from '@/app/frames/core/time-range'
import type { FrameExtractionSettings, VideoSource } from '@/app/frames/core/types'
import { extractVideoFrames, loadVideoFile } from '@/app/frames/core/video-frame-extractor'
import { canvasToBlob, createCanvasFromImageData } from '@/lib/image/canvas'

import { getVideoSource, setVideoSource } from '../asset-helpers'
import type { StudioAsset, StudioAssetInput } from '../types'

/**
 * Resolve or reload a VideoSource for a persisted video asset.
 * Video elements are kept in memory; after page reload they must be recreated from the stored blob.
 * @param videoAsset Persisted video asset from IndexedDB
 * @returns Loaded video source ready for seeking
 */
export async function resolveVideoSource(videoAsset: StudioAsset): Promise<VideoSource> {
  const cached = getVideoSource(videoAsset.id)
  if (cached) return cached

  const source = await loadVideoFile(new File([videoAsset.blob], videoAsset.name, { type: videoAsset.mimeType }))
  setVideoSource(videoAsset.id, source)
  return source
}

/**
 * Extract frames from a video asset and build asset inputs for persistence
 * Pipeline: resolve video -> compute timestamps -> seek/capture each frame -> encode as WEBP
 * @param videoAsset Source video asset
 * @param settings Extraction range and interval settings
 * @param onProgress Optional progress callback
 * @returns Frame asset inputs linked to the parent video via parentId
 */
export async function extractFramesFromVideo(
  videoAsset: StudioAsset,
  settings: FrameExtractionSettings,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<StudioAssetInput[]> {
  const source = await resolveVideoSource(videoAsset)
  const range = resolveTimeRange(settings.startInput, settings.endInput, source.duration)
  const timestamps = buildFrameTimestamps(range, settings.intervalMs, settings.maxFrames)

  if (timestamps.length === 0) {
    return []
  }

  const extracted = await extractVideoFrames(source, timestamps, settings.maxDimension, (p) => {
    onProgress?.(p.current, p.total, p.status)
  })

  const baseName = videoAsset.name.replace(/\.[^.]+$/, '')
  const outputs: StudioAssetInput[] = []

  for (const frame of extracted) {
    const canvas = createCanvasFromImageData(frame.imageData)
    const blob = await canvasToBlob(canvas, 'image/webp', 0.85)
    outputs.push({
      name: `${baseName}-frame-${frame.timestamp}ms.webp`,
      kind: 'image',
      source: 'frame',
      mimeType: 'image/webp',
      blob,
      width: frame.imageData.width,
      height: frame.imageData.height,
      size: blob.size,
      parentId: videoAsset.id,
      meta: { timestampMs: frame.timestamp, frameIndex: frame.index },
    })
  }

  return outputs
}
