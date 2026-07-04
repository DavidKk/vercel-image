/**
 * Core domain types for the Studio editor
 */

/** Kind of asset stored in the library */
export type AssetKind = 'image' | 'video' | 'gif' | 'sprite' | 'text-document'

/** Origin of an asset within the pipeline */
export type AssetSource = 'import' | 'background-removed' | 'converted' | 'frame' | 'gif' | 'sprite' | 'text' | 'text-document'

/**
 * A single asset persisted in the Studio library (IndexedDB)
 */
export interface StudioAsset {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Asset kind */
  kind: AssetKind
  /** How the asset was produced */
  source: AssetSource
  /** MIME type of the stored blob */
  mimeType: string
  /** Stored binary payload */
  blob: Blob
  /** Pixel width (0 for non-visual) */
  width: number
  /** Pixel height (0 for non-visual) */
  height: number
  /** Byte size of the blob */
  size: number
  /** Parent asset id when derived from another asset */
  parentId?: string
  /** Creation timestamp (epoch ms) */
  createdAt: number
  /** Last update timestamp (epoch ms) */
  updatedAt: number
  /** Manual library sort position (higher values appear first) */
  sortOrder: number
  /** Optional free-form metadata (e.g. frame timestamp, sprite layout) */
  meta?: Record<string, unknown>
}

/** Input used to create a new asset */
export type StudioAssetInput = Omit<StudioAsset, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> & {
  id?: string
  createdAt?: number
  updatedAt?: number
  sortOrder?: number
}
