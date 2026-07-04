'use client'

/**
 * Export inspector configuration hints
 */
import { useStudio } from '../../../context/StudioContext'

/**
 * Export operation panel
 * @returns Operation panel element
 */
export function ExportOp() {
  const { selectedAssets, assets, primarySelected } = useStudio()
  const exportCount = selectedAssets.length > 0 ? selectedAssets.length : assets.length

  return (
    <div className="space-y-2 text-xs text-gray-600">
      <p>
        Export {exportCount} asset{exportCount === 1 ? '' : 's'} as a ZIP archive using Submit below.
      </p>
      {primarySelected && selectedAssets.length === 1 && <p className="text-gray-400">Selected: {primarySelected.name}</p>}
    </div>
  )
}
