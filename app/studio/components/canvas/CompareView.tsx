'use client'

/**
 * Side-by-side compare view: original vs processed
 */
import { useEffect, useState } from 'react'

import { PreviewPane } from '@/app/progress/components/PreviewPane'
import { blobToImage } from '@/lib/image/canvas'
import type { StudioAsset } from '@/lib/studio/types'

interface CompareViewProps {
  /** Processed asset (must have parentId) */
  asset: StudioAsset
  /** Original parent asset */
  parent: StudioAsset
}

/**
 * Compare original and processed assets side by side
 * @param props Component props
 * @returns Compare view element
 */
export function CompareView(props: CompareViewProps) {
  const { asset, parent } = props
  const [leftImage, setLeftImage] = useState<HTMLImageElement | null>(null)
  const [rightImage, setRightImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([blobToImage(parent.blob), blobToImage(asset.blob)]).then(([left, right]) => {
      if (active) {
        setLeftImage(left)
        setRightImage(right)
      }
    })
    return () => {
      active = false
    }
  }, [asset, parent])

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col border-r border-gray-200">
        <div className="border-b bg-white/90 px-4 py-2 text-xs font-medium text-gray-500">Original</div>
        <div className={`flex-1 ${leftImage ? 'studio-checkerboard' : 'bg-white'}`}>{leftImage && <PreviewPane image={leftImage} transparentBackground />}</div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="border-b bg-white/90 px-4 py-2 text-xs font-medium text-gray-500">Processed</div>
        <div className={`flex-1 ${rightImage ? 'studio-checkerboard' : 'bg-white'}`}>{rightImage && <PreviewPane image={rightImage} transparentBackground />}</div>
      </div>
    </div>
  )
}
