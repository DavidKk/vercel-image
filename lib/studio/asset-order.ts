/**
 * Asset ordering helpers for the Studio library
 */
import type { StudioAsset } from './types'

/** Spacing between consecutive sortOrder values */
const SORT_ORDER_STEP = 1000

/**
 * Compare assets by sort order (higher values appear first)
 * @param a First asset
 * @param b Second asset
 * @returns Comparison result for Array.sort
 */
export function compareAssetSortOrder(a: StudioAsset, b: StudioAsset): number {
  const aOrder = a.sortOrder ?? a.createdAt
  const bOrder = b.sortOrder ?? b.createdAt
  return bOrder - aOrder
}

/**
 * Return a new array sorted by sortOrder descending
 * @param assets Assets to sort
 * @returns Sorted copy
 */
export function sortAssetsByOrder(assets: StudioAsset[]): StudioAsset[] {
  return [...assets].sort(compareAssetSortOrder)
}

/**
 * Assign descending sortOrder values with fixed spacing
 * @param assets Assets in display order (first item gets highest sortOrder)
 * @returns Assets with updated sortOrder fields
 */
export function assignDescendingSortOrders(assets: StudioAsset[]): StudioAsset[] {
  const count = assets.length
  return assets.map((asset, index) => ({
    ...asset,
    sortOrder: (count - index) * SORT_ORDER_STEP,
  }))
}

/**
 * Reorder assets within a filtered library view and merge back into the full list
 * @param allAssets Full persisted asset list
 * @param filteredIds Ids visible in the active filter (in display order)
 * @param sourceId Dragged asset id
 * @param targetIndex Drop index within the filtered id list
 * @returns Reordered assets with refreshed sortOrder values
 */
export function reorderFilteredAssets(allAssets: StudioAsset[], filteredIds: string[], sourceId: string, targetIndex: number): StudioAsset[] {
  const sorted = sortAssetsByOrder(allAssets)
  const filteredSet = new Set(filteredIds)
  const filteredInOrder = sorted.filter((asset) => filteredSet.has(asset.id))
  const fromIndex = filteredInOrder.findIndex((asset) => asset.id === sourceId)

  if (fromIndex === -1 || fromIndex === targetIndex) {
    return sorted
  }

  const reorderedFiltered = [...filteredInOrder]
  const [moved] = reorderedFiltered.splice(fromIndex, 1)
  reorderedFiltered.splice(targetIndex, 0, moved)

  const queue = [...reorderedFiltered]
  const merged = sorted.map((asset) => {
    if (!filteredSet.has(asset.id)) {
      return asset
    }
    return queue.shift()!
  })

  return assignDescendingSortOrders(merged)
}
