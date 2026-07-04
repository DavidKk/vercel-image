/**
 * Asset import and preview URL helpers for Studio
 */
import type { VideoSource } from '@/app/frames/core/types'
import { captureVideoFrameBlob, loadVideoFile } from '@/app/frames/core/video-frame-extractor'
import { fileToImage } from '@/lib/image/canvas'

import { createAssetId } from './asset-service'
import { isTextDocumentAsset, TEXT_DOCUMENT_MIME } from './text-document'
import type { AssetKind, AssetSource, StudioAsset, StudioAssetInput } from './types'

export { isTextDocumentAsset }

/** In-memory video poster URL cache keyed by asset id */
const videoPosterCache = new Map<string, string>()

/** In-memory object URL cache keyed by asset id */
const urlCache = new Map<string, { url: string; blobSize: number }>()

/** In-memory video source cache keyed by asset id */
const videoCache = new Map<string, VideoSource>()

/**
 * Get or create an object URL for an asset blob
 * @param id Asset identifier
 * @param blob Asset binary data
 * @returns Object URL for preview
 */
export function getAssetObjectUrl(id: string, blob: Blob): string {
  const cached = urlCache.get(id)
  if (cached && cached.blobSize === blob.size) return cached.url

  if (cached) {
    URL.revokeObjectURL(cached.url)
  }

  const url = URL.createObjectURL(blob)
  urlCache.set(id, { url, blobSize: blob.size })
  return url
}

/**
 * Revoke cached object URL for an asset
 * @param id Asset identifier
 * @returns Nothing
 */
export function revokeAssetObjectUrl(id: string): void {
  const cached = urlCache.get(id)
  if (cached) {
    URL.revokeObjectURL(cached.url)
    urlCache.delete(id)
  }
  revokeVideoPosterUrl(id)
}

/**
 * Revoke cached video poster URL for an asset
 * @param id Asset identifier
 * @returns Nothing
 */
export function revokeVideoPosterUrl(id: string): void {
  const url = videoPosterCache.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    videoPosterCache.delete(id)
  }
}

/**
 * Revoke all cached object URLs
 * @returns Nothing
 */
export function revokeAllObjectUrls(): void {
  for (const cached of urlCache.values()) {
    URL.revokeObjectURL(cached.url)
  }
  urlCache.clear()
  for (const url of videoPosterCache.values()) {
    URL.revokeObjectURL(url)
  }
  videoPosterCache.clear()
}

/**
 * Store a loaded video source for an asset
 * @param id Asset identifier
 * @param source Loaded video source
 * @returns Nothing
 */
export function setVideoSource(id: string, source: VideoSource): void {
  videoCache.set(id, source)
}

/**
 * Get cached video source for an asset
 * @param id Asset identifier
 * @returns Video source or undefined
 */
export function getVideoSource(id: string): VideoSource | undefined {
  return videoCache.get(id)
}

/**
 * Remove and dispose a cached video source
 * @param id Asset identifier
 * @returns Nothing
 */
export function removeVideoSource(id: string): void {
  const source = videoCache.get(id)
  if (source) {
    source.video.pause()
    source.video.removeAttribute('src')
    source.video.load()
    URL.revokeObjectURL(source.url)
    videoCache.delete(id)
  }
}

/** Default max dimension for library video poster thumbnails */
const VIDEO_POSTER_MAX_DIMENSION = 512

/**
 * Resolve or load a video source for poster generation
 * @param id Asset identifier
 * @param blob Video blob
 * @param name Asset file name
 * @param mimeType Video MIME type
 * @returns Loaded video source
 */
async function resolveVideoSourceForPoster(id: string, blob: Blob, name: string, mimeType: string): Promise<VideoSource> {
  const cached = getVideoSource(id)
  if (cached) return cached

  const source = await loadVideoFile(new File([blob], name, { type: mimeType }))
  setVideoSource(id, source)
  return source
}

/**
 * Get or generate a poster URL from the first video frame
 * @param id Asset identifier
 * @param blob Video blob
 * @param name Asset file name
 * @param mimeType Video MIME type
 * @returns Poster object URL or null when capture fails
 */
export async function getVideoPosterUrl(id: string, blob: Blob, name: string, mimeType: string): Promise<string | null> {
  const cached = videoPosterCache.get(id)
  if (cached) return cached

  try {
    const source = await resolveVideoSourceForPoster(id, blob, name, mimeType)
    const frameBlob = await captureVideoFrameBlob(source, 0, VIDEO_POSTER_MAX_DIMENSION)
    const url = URL.createObjectURL(frameBlob)
    videoPosterCache.set(id, url)
    return url
  } catch {
    return null
  }
}

/**
 * Build a StudioAssetInput from an image file
 * @param file Source image file
 * @returns Asset input ready for persistence
 */
export async function buildImageAssetInput(file: File): Promise<StudioAssetInput> {
  const image = await fileToImage(file)
  const mimeType = file.type || 'image/png'
  return {
    name: file.name,
    kind: mimeToKind(mimeType),
    source: 'import',
    mimeType,
    blob: file,
    width: image.naturalWidth,
    height: image.naturalHeight,
    size: file.size,
  }
}

/**
 * Build a StudioAssetInput from a video file and cache the video source
 * @param file Source video file
 * @returns Asset input and loaded video source
 */
export async function buildVideoAssetInput(file: File): Promise<{ input: StudioAssetInput; source: VideoSource }> {
  const source = await loadVideoFile(file)
  const id = createAssetId()
  setVideoSource(id, source)
  return {
    input: {
      id,
      name: file.name,
      kind: 'video',
      source: 'import',
      mimeType: file.type || 'video/mp4',
      blob: file,
      width: source.width,
      height: source.height,
      size: file.size,
      meta: { durationMs: Math.round(source.duration * 1000) },
    },
    source,
  }
}

/**
 * Derive asset kind from MIME type
 * @param mimeType MIME type string
 * @returns Asset kind
 */
export function mimeToKind(mimeType: string): AssetKind {
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'image/gif') return 'gif'
  return 'image'
}

/**
 * Whether an image asset is an imported original
 * @param asset Studio asset
 * @returns True when the asset is an imported image
 */
export function isImportedImage(asset: StudioAsset): boolean {
  return asset.kind === 'image' && asset.source === 'import'
}

/**
 * Whether an image asset was generated by a pipeline operation
 * @param asset Studio asset
 * @returns True when the asset is a derived image
 */
export function isGeneratedImage(asset: StudioAsset): boolean {
  return asset.kind === 'image' && asset.source !== 'import'
}

/**
 * Whether an asset is an original imported raster image suitable as a pipeline source
 * @param asset Studio asset
 * @returns True when remove-bg, convert, or add-text can target this asset
 */
export function isPipelineSourceImage(asset: StudioAsset): boolean {
  return isStaticImageAsset(asset) && isImportedImage(asset)
}

/**
 * Whether an asset is a video frame suitable for GIF or sprite composition
 * @param asset Studio asset
 * @returns True when the asset was extracted as a video frame
 */
export function isFrameAsset(asset: StudioAsset): boolean {
  return asset.source === 'frame'
}

/**
 * Whether an asset is an animated or static GIF
 * @param asset Studio asset
 * @returns True when the asset is a GIF
 */
export function isGifAsset(asset: StudioAsset): boolean {
  return asset.kind === 'gif' || asset.mimeType === 'image/gif'
}

/**
 * Whether an asset is a static raster image suitable for single-frame AI processing
 * @param asset Studio asset
 * @returns True for non-GIF image assets
 */
export function isStaticImageAsset(asset: StudioAsset): boolean {
  return asset.kind === 'image' && asset.mimeType.startsWith('image/') && asset.mimeType !== 'image/gif'
}

/**
 * Derive asset source label for display
 * @param source Asset source enum
 * @returns Human-readable label
 */
export function sourceLabel(source: AssetSource): string {
  switch (source) {
    case 'import':
      return 'Original'
    case 'background-removed':
      return 'No BG'
    case 'converted':
      return 'Converted'
    case 'frame':
      return 'Frame'
    case 'gif':
      return 'GIF'
    case 'sprite':
      return 'Sprite'
    case 'text':
      return 'Text'
    case 'text-document':
      return 'Text doc'
    default:
      return source
  }
}

/**
 * Format MIME type to short extension label
 * @param mimeType MIME type string
 * @returns Short format label
 */
export function mimeToLabel(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/webp': 'WEBP',
    'image/gif': 'GIF',
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
    [TEXT_DOCUMENT_MIME]: 'Text doc',
  }
  return map[mimeType] ?? mimeType.split('/').pop()?.toUpperCase() ?? 'FILE'
}
