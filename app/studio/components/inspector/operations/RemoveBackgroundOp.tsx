'use client'

/**
 * Remove background inspector operation panel
 */
import { ProcessingSettings } from '@/app/progress/components/ProcessingSettings'
import { PanelEmptyState } from '@/components/PanelEmptyState'
import { isGifAsset } from '@/lib/studio/asset-helpers'

import { useStudio } from '../../../context/StudioContext'

/**
 * Remove background operation panel
 * @returns Operation panel element
 */
export function RemoveBackgroundOp() {
  const {
    processingConfig,
    setProcessingConfig,
    selectedAssets,
    needsModelReload,
    handleReloadModel,
    isModelInitializing,
    autoSegmentSupported,
    autoSegmentSupportChecked,
    isBusy,
  } = useStudio()
  const selectedGifs = selectedAssets.filter(isGifAsset)

  if (!autoSegmentSupportChecked) {
    return <PanelEmptyState message="Loading..." loading className="min-h-full" />
  }

  if (!autoSegmentSupported) {
    return <PanelEmptyState message="AI background removal is not supported in this browser" messageClassName="text-red-600" className="min-h-full" />
  }

  return (
    <div className="space-y-3">
      {selectedGifs.length > 0 ? (
        <p className="text-xs text-gray-500">
          {selectedGifs.length === 1
            ? 'Animated GIFs are processed frame-by-frame, then merged into a new GIF with 1-bit transparency (hard edges, no semi-transparent feathering).'
            : `${selectedGifs.length} GIFs will be processed frame-by-frame and re-encoded with 1-bit transparency.`}
        </p>
      ) : null}
      <ProcessingSettings
        config={processingConfig}
        onChange={setProcessingConfig}
        disabled={isBusy || isModelInitializing}
        needsModelReload={needsModelReload}
        onReloadModel={handleReloadModel}
        isReloading={isModelInitializing}
        showReset={false}
      />
    </div>
  )
}
