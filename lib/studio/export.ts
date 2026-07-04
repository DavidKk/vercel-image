/**
 * Export utilities: single download and ZIP archive
 */
import { zipSync } from 'fflate'

import { downloadBlob } from '@/lib/image/canvas'

import type { StudioAsset } from './types'

/**
 * Download a single asset blob
 * @param asset Asset to download
 * @returns Nothing
 */
export function downloadAsset(asset: StudioAsset): void {
  downloadBlob(asset.blob, asset.name)
}

/**
 * Download multiple assets as a ZIP archive
 * @param assets Assets to include
 * @param filename ZIP filename
 * @returns Promise resolved when download starts
 */
export async function downloadAssetsAsZip(assets: StudioAsset[], filename = 'studio-export.zip'): Promise<void> {
  if (assets.length === 0) return

  const files: Record<string, Uint8Array> = {}
  const usedNames = new Set<string>()

  for (const asset of assets) {
    let name = asset.name
    let counter = 1
    while (usedNames.has(name)) {
      const dot = asset.name.lastIndexOf('.')
      name = dot > 0 ? `${asset.name.slice(0, dot)}-${counter}${asset.name.slice(dot)}` : `${asset.name}-${counter}`
      counter++
    }
    usedNames.add(name)
    const buffer = await asset.blob.arrayBuffer()
    files[name] = new Uint8Array(buffer)
  }

  const zipped = zipSync(files)
  const blob = new Blob([zipped], { type: 'application/zip' })
  downloadBlob(blob, filename)
}
