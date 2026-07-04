'use client'

/**
 * Sprite sheet preview view
 */
import { getAssetObjectUrl } from '@/lib/studio/asset-helpers'
import { getPendingJobId, isPendingAsset } from '@/lib/studio/pending-asset'
import type { StudioAsset } from '@/lib/studio/types'

import { useStudio } from '../../context/StudioContext'
import { GeneratingResultView } from './GeneratingResultView'

interface SpriteViewProps {
  /** Sprite asset to preview */
  asset: StudioAsset
}

/**
 * Sprite sheet preview with frame grid overlay info
 * @param props Component props
 * @returns Sprite view element
 */
export function SpriteView(props: SpriteViewProps) {
  const { asset } = props
  const { jobs } = useStudio()

  if (isPendingAsset(asset)) {
    const jobId = getPendingJobId(asset)
    const job = jobId ? jobs.find((entry) => entry.id === jobId) : undefined
    return <GeneratingResultView name={asset.name} statusLabel={job?.message ?? 'Composing sprite sheet…'} progress={job?.status === 'running' ? job.progress : undefined} />
  }

  const url = getAssetObjectUrl(asset.id, asset.blob)
  const frameCount = (asset.meta?.frameCount as number) ?? 0
  const columns = (asset.meta?.columns as number) ?? 8

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-full max-h-full flex flex-col items-center gap-3">
        <div
          className="relative rounded-lg overflow-hidden border border-gray-100 max-w-full"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        >
          <img src={url} alt="Sprite sheet" className="max-w-full max-h-[calc(100vh-280px)] object-contain block" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-800">Sprite Preview</p>
          <p className="text-xs text-gray-500">
            {asset.width}×{asset.height} · {frameCount} frames · {columns} columns
          </p>
        </div>
      </div>
    </div>
  )
}
