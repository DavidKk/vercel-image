/**
 * Asset persistence service backed by Dexie
 */
import { getStudioDb } from './db'
import type { StudioAsset, StudioAssetInput } from './types'

/**
 * Generate a unique identifier for a new asset
 * @returns Random unique id string
 */
export function createAssetId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Persist a new asset into the library
 * @param input Asset data without generated fields
 * @returns The fully populated stored asset
 */
export async function addAsset(input: StudioAssetInput): Promise<StudioAsset> {
  const now = Date.now()
  const asset: StudioAsset = {
    ...input,
    id: input.id ?? createAssetId(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  }
  await getStudioDb().assets.put(asset)
  return asset
}

/**
 * Persist multiple assets in a single transaction
 * @param inputs Array of asset inputs
 * @returns The stored assets
 */
export async function addAssets(inputs: StudioAssetInput[]): Promise<StudioAsset[]> {
  const now = Date.now()
  const assets: StudioAsset[] = inputs.map((input) => ({
    ...input,
    id: input.id ?? createAssetId(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  }))
  await getStudioDb().assets.bulkPut(assets)
  return assets
}

/**
 * List all assets ordered by creation time (newest first)
 * @returns Array of stored assets
 */
export async function listAssets(): Promise<StudioAsset[]> {
  const assets = await getStudioDb().assets.orderBy('createdAt').toArray()
  return assets.reverse()
}

/**
 * Get a single asset by id
 * @param id Asset identifier
 * @returns The asset or undefined when missing
 */
export async function getAsset(id: string): Promise<StudioAsset | undefined> {
  return getStudioDb().assets.get(id)
}

/**
 * Update mutable fields of an asset
 * @param id Asset identifier
 * @param changes Partial fields to update
 * @returns Number of updated records
 */
export async function updateAsset(id: string, changes: Partial<StudioAsset>): Promise<number> {
  return getStudioDb().assets.update(id, { ...changes, updatedAt: Date.now() })
}

/**
 * Delete a single asset
 * @param id Asset identifier
 * @returns Promise resolved when deleted
 */
export async function deleteAsset(id: string): Promise<void> {
  await getStudioDb().assets.delete(id)
}

/**
 * Delete multiple assets
 * @param ids Asset identifiers
 * @returns Promise resolved when deleted
 */
export async function deleteAssets(ids: string[]): Promise<void> {
  await getStudioDb().assets.bulkDelete(ids)
}

/**
 * Remove every asset from the library
 * @returns Promise resolved when cleared
 */
export async function clearAssets(): Promise<void> {
  await getStudioDb().assets.clear()
}
