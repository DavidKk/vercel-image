/**
 * Export utilities: single download and ZIP archive
 */
import { zipSync } from 'fflate'

import { downloadBlob } from '@/lib/image/canvas'

import { resolveAssetExport } from './text-document'
import type { StudioAsset } from './types'

/**
 * Download a single asset blob (flattens text documents on export)
 * @param asset Asset to download
 * @param assets All assets for resolving text document parents
 * @returns Promise resolved when download starts
 */
export async function downloadAsset(asset: StudioAsset, assets: StudioAsset[]): Promise<void> {
  const { blob, filename } = await resolveAssetExport(asset, assets)
  downloadBlob(blob, filename)
}

/**
 * Download multiple assets as a ZIP archive (flattens text documents on export)
 * @param assets Assets to include
 * @param library All loaded assets for resolving text document parents
 * @param filename ZIP filename
 * @returns Promise resolved when download starts
 */
export async function downloadAssetsAsZip(assets: StudioAsset[], library: StudioAsset[], filename = 'studio-export.zip'): Promise<void> {
  if (assets.length === 0) return

  const files: Record<string, Uint8Array> = {}
  const usedNames = new Set<string>()

  for (const asset of assets) {
    const { blob, filename: exportName } = await resolveAssetExport(asset, library)
    let name = exportName
    let counter = 1
    while (usedNames.has(name)) {
      const dot = exportName.lastIndexOf('.')
      name = dot > 0 ? `${exportName.slice(0, dot)}-${counter}${exportName.slice(dot)}` : `${exportName}-${counter}`
      counter++
    }
    usedNames.add(name)
    const buffer = await blob.arrayBuffer()
    files[name] = new Uint8Array(buffer)
  }

  const zipped = zipSync(files)
  const blob = new Blob([zipped], { type: 'application/zip' })
  downloadBlob(blob, filename)
}
