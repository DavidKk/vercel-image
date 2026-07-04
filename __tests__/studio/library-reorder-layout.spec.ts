import { computeLibraryDisplayIndices } from '@/app/studio/components/library/library-reorder-layout'
import { reorderFilteredAssets } from '@/lib/studio/asset-order'
import type { StudioAsset } from '@/lib/studio/types'

function makeAsset(id: string, sortOrder: number): StudioAsset {
  return {
    id,
    name: `${id}.png`,
    kind: 'image',
    mimeType: 'image/png',
    width: 100,
    height: 100,
    size: 1000,
    source: 'import',
    createdAt: sortOrder,
    updatedAt: sortOrder,
    sortOrder,
    blob: new Blob(),
  }
}

describe('computeLibraryDisplayIndices', () => {
  it('should open the gap at slot 1 when moving from slot 2 to slot 1', () => {
    const display = computeLibraryDisplayIndices(4, 2, 1)

    expect(display[2]).toBe(1)
    expect(display[0]).toBe(0)
    expect(display[1]).toBe(2)
    expect(display[3]).toBe(3)
  })

  it('should open the gap at slot 3 when moving from slot 1 to slot 3', () => {
    const display = computeLibraryDisplayIndices(4, 1, 3)

    expect(display[1]).toBe(3)
    expect(display[0]).toBe(0)
    expect(display[2]).toBe(1)
    expect(display[3]).toBe(2)
  })
})

describe('reorderFilteredAssets', () => {
  it('should move an asset to slot 1 when target index is 1', () => {
    const assets = [makeAsset('a', 4000), makeAsset('b', 3000), makeAsset('c', 2000), makeAsset('d', 1000)]
    const filteredIds = ['a', 'b', 'c', 'd']

    const reordered = reorderFilteredAssets(assets, filteredIds, 'c', 1)
    const order = reordered.map((asset) => asset.id)

    expect(order).toEqual(['a', 'c', 'b', 'd'])
  })
})
