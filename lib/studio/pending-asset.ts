/**
 * In-memory placeholder assets shown while a Studio job is running
 */
import { getMergedGifFilename } from '@/app/frames/core/gif-merge'
import type { BackgroundRemovalUserConfig } from '@/app/progress/core/model-config'
import { getOutputExtension } from '@/app/progress/core/model-config'

import { getSpriteFilename } from './sprite-merge'
import type { AssetKind, AssetSource, StudioAsset } from './types'

/** Minimal 1×1 transparent PNG used as a placeholder blob */
const PLACEHOLDER_PNG_BYTES = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (char) =>
  char.charCodeAt(0)
)

/** Shared placeholder blob for pending previews */
export const PENDING_PLACEHOLDER_BLOB = new Blob([PLACEHOLDER_PNG_BYTES], { type: 'image/png' })

/** Options for creating a pending placeholder asset */
export interface CreatePendingAssetOptions {
  /** Output asset kind */
  kind: AssetKind
  /** Output asset source */
  source: AssetSource
  /** Display name for the expected result */
  name: string
  /** Job that will produce this asset */
  jobId: string
  /** Parent asset id when derived */
  parentId?: string
  /** Expected pixel width */
  width?: number
  /** Expected pixel height */
  height?: number
  /** MIME type of the expected result */
  mimeType?: string
  /** Optional metadata copied to the final asset */
  meta?: Record<string, unknown>
}

/**
 * Whether an asset is an in-memory pending placeholder
 * @param asset Asset to inspect
 * @returns True when the asset is still being generated
 */
export function isPendingAsset(asset: StudioAsset): boolean {
  return asset.meta?.pending === true
}

/**
 * Read the job id linked to a pending asset
 * @param asset Pending asset
 * @returns Job id or undefined
 */
export function getPendingJobId(asset: StudioAsset): string | undefined {
  const jobId = asset.meta?.jobId
  return typeof jobId === 'string' ? jobId : undefined
}

/**
 * Create an in-memory placeholder asset for a job output
 * @param options Pending asset configuration
 * @returns Placeholder asset (not persisted to IndexedDB)
 */
export function createPendingAsset(options: CreatePendingAssetOptions): StudioAsset {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: options.name,
    kind: options.kind,
    source: options.source,
    mimeType: options.mimeType ?? 'image/png',
    blob: PENDING_PLACEHOLDER_BLOB,
    width: options.width ?? 0,
    height: options.height ?? 0,
    size: 0,
    parentId: options.parentId,
    createdAt: now,
    updatedAt: now,
    meta: {
      pending: true,
      jobId: options.jobId,
      ...options.meta,
    },
  }
}

/**
 * Build filename suffix for GIF background removal outputs
 * @param mode Background removal mode
 * @returns Filename suffix token
 */
function getGifModeSuffix(mode: BackgroundRemovalUserConfig['mode']): string {
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
 * Build a pending asset for a background removal target
 * @param target Source image or GIF asset
 * @param jobId Active job id
 * @param config Background removal configuration
 * @returns Pending output asset
 */
export function buildPendingRemoveBackgroundAsset(target: StudioAsset, jobId: string, config: BackgroundRemovalUserConfig): StudioAsset {
  const baseName = target.name.replace(/\.[^.]+$/, '')

  if (target.kind === 'gif' || target.mimeType === 'image/gif') {
    const suffix = getGifModeSuffix(config.mode)
    return createPendingAsset({
      kind: 'gif',
      source: 'background-removed',
      name: `${baseName}-${suffix}.gif`,
      jobId,
      parentId: target.id,
      width: target.width,
      height: target.height,
      mimeType: 'image/gif',
    })
  }

  const ext = getOutputExtension(config.outputFormat)
  const mimeType = config.outputFormat === 'image/jpeg' || config.outputFormat === 'image/webp' ? config.outputFormat : 'image/png'

  return createPendingAsset({
    kind: 'image',
    source: 'background-removed',
    name: `${baseName}-nobg.${ext}`,
    jobId,
    parentId: target.id,
    width: target.width,
    height: target.height,
    mimeType,
  })
}

/**
 * Build a pending asset for a format conversion target
 * @param target Source image asset
 * @param jobId Active job id
 * @param format Target MIME type
 * @returns Pending output asset
 */
export function buildPendingConvertAsset(target: StudioAsset, jobId: string, format: 'image/png' | 'image/jpeg' | 'image/webp'): StudioAsset {
  const ext = format.split('/')[1]
  const baseName = target.name.replace(/\.[^.]+$/, '')

  return createPendingAsset({
    kind: 'image',
    source: 'converted',
    name: `${baseName}.${ext}`,
    jobId,
    parentId: target.id,
    width: target.width,
    height: target.height,
    mimeType: format,
  })
}

/**
 * Build a pending asset for GIF composition
 * @param frames Source frame assets
 * @param jobId Active job id
 * @param parentVideoName Optional parent video name for the output filename
 * @param intervalMs Frame interval for metadata
 * @returns Pending GIF asset
 */
export function buildPendingComposeGifAsset(frames: StudioAsset[], jobId: string, parentVideoName: string | undefined, intervalMs: number): StudioAsset {
  const name = parentVideoName ? getMergedGifFilename(parentVideoName) : 'merged.gif'
  const first = frames[0]

  return createPendingAsset({
    kind: 'gif',
    source: 'gif',
    name,
    jobId,
    parentId: first?.parentId,
    width: first?.width ?? 0,
    height: first?.height ?? 0,
    mimeType: 'image/gif',
    meta: { frameCount: frames.length, intervalMs },
  })
}

/**
 * Build a pending asset for sprite sheet composition
 * @param frames Source frame assets
 * @param jobId Active job id
 * @param columns Column count for metadata
 * @returns Pending sprite asset
 */
export function buildPendingComposeSpriteAsset(frames: StudioAsset[], jobId: string, columns: number): StudioAsset {
  const baseName = frames[0]?.name.replace(/\.[^.]+$/, '').replace(/-frame-\d+ms$/, '') ?? 'sprite'

  return createPendingAsset({
    kind: 'sprite',
    source: 'sprite',
    name: getSpriteFilename(baseName),
    jobId,
    parentId: frames[0]?.parentId,
    width: 0,
    height: 0,
    mimeType: 'image/png',
    meta: { frameCount: frames.length, columns },
  })
}

/**
 * Build a pending asset for frame extraction from video
 * @param videoAsset Source video asset
 * @param jobId Active job id
 * @returns Pending placeholder shown until frames are ready
 */
export function buildPendingExtractFramesAsset(videoAsset: StudioAsset, jobId: string): StudioAsset {
  const baseName = videoAsset.name.replace(/\.[^.]+$/, '')

  return createPendingAsset({
    kind: 'image',
    source: 'frame',
    name: `${baseName}-frames…`,
    jobId,
    parentId: videoAsset.id,
  })
}

/**
 * Resolve library filter and canvas view for pending outputs
 * @param pending Pending output assets
 * @returns Navigation targets for the Studio UI
 */
export function resolvePendingNavigation(pending: StudioAsset[]): {
  viewMode: 'detail' | 'sprite'
  kindFilter: 'image' | 'gif' | 'sprite'
  imageOrigin?: 'generated'
} {
  if (pending.length > 0 && pending.every((asset) => asset.kind === 'gif')) {
    return { viewMode: 'detail', kindFilter: 'gif' }
  }

  if (pending.length > 0 && pending.every((asset) => asset.kind === 'sprite')) {
    return { viewMode: 'sprite', kindFilter: 'sprite' }
  }

  return { viewMode: 'detail', kindFilter: 'image', imageOrigin: 'generated' }
}
