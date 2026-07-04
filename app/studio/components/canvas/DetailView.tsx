'use client'

/**
 * Detail view wrapping PreviewPane for a single asset
 */
import { useEffect, useState } from 'react'

import { PreviewPane } from '@/app/progress/components/PreviewPane'
import { blobToImage } from '@/lib/image/canvas'
import { getAssetObjectUrl, isTextDocumentAsset } from '@/lib/studio/asset-helpers'
import { getPendingJobId, isPendingAsset } from '@/lib/studio/pending-asset'
import type { StudioAsset } from '@/lib/studio/types'

import { useStudio } from '../../context/StudioContext'
import { GeneratingResultView } from './GeneratingResultView'
import { TextDocumentPreview } from './TextDocumentPreview'

interface DetailViewProps {
  /** Asset to preview */
  asset: StudioAsset
}

/**
 * Single asset detail view with zoom/pan
 * @param props Component props
 * @returns Detail view element
 */
export function DetailView(props: DetailViewProps) {
  const { asset } = props
  const { jobs } = useStudio()
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const pending = isPendingAsset(asset)

  useEffect(() => {
    if (pending || asset.kind === 'video' || asset.kind === 'gif' || asset.mimeType === 'image/gif' || isTextDocumentAsset(asset)) {
      setImage(null)
      return
    }
    let active = true
    blobToImage(asset.blob)
      .then((img) => {
        if (active) setImage(img)
      })
      .catch(() => {
        if (active) setImage(null)
      })
    return () => {
      active = false
    }
  }, [asset, pending])

  if (pending) {
    const jobId = getPendingJobId(asset)
    const job = jobId ? jobs.find((entry) => entry.id === jobId) : undefined
    return <GeneratingResultView name={asset.name} statusLabel={job?.message ?? 'Generating…'} progress={job?.status === 'running' ? job.progress : undefined} />
  }

  if (isTextDocumentAsset(asset)) {
    return <TextDocumentPreview asset={asset} />
  }

  if (asset.kind === 'video') {
    const url = getAssetObjectUrl(asset.id, asset.blob)
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <video src={url} controls className="max-w-full max-h-[70vh] rounded-lg shadow-lg bg-black" />
      </div>
    )
  }

  if (asset.kind === 'gif' || asset.mimeType === 'image/gif') {
    const url = getAssetObjectUrl(asset.id, asset.blob)
    return (
      <div className="flex h-full items-center justify-center p-4">
        <img src={url} alt={asset.name} className="max-h-full max-w-full rounded-lg object-contain shadow-lg" />
      </div>
    )
  }

  return <div className={`relative h-full ${image ? 'studio-checkerboard' : 'bg-white'}`}>{image && <PreviewPane image={image} transparentBackground />}</div>
}
