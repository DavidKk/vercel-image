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
      <div className="flex max-w-full max-h-full flex-col items-center gap-3 rounded-studio-lg border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] p-4 shadow-studio-md">
        <div className="relative max-w-full overflow-hidden rounded-studio-md border border-[var(--studio-surface-border)] studio-checkerboard">
          <img src={url} alt="Sprite sheet" className="block max-h-[calc(100vh-280px)] max-w-full object-contain" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-[var(--studio-surface-fg)]">Sprite Preview</p>
          <p className="text-xs text-[var(--studio-surface-fg-muted)]">
            {asset.width}×{asset.height} · {frameCount} frames · {columns} columns
          </p>
        </div>
      </div>
    </div>
  )
}
