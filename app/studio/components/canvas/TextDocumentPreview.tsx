'use client'

/**
 * Read-only preview of a flattened text document
 */
import { useEffect, useState } from 'react'

import { PreviewPane } from '@/app/progress/components/PreviewPane'
import { blobToImage } from '@/lib/image/canvas'
import { getTextDocumentBaseAsset, parseTextDocument, renderTextDocument } from '@/lib/studio/text-document'
import type { StudioAsset } from '@/lib/studio/types'

import { useStudio } from '../../context/StudioContext'

interface TextDocumentPreviewProps {
  /** Text document asset */
  asset: StudioAsset
}

/**
 * Render a text document as a flattened image preview
 * @param props Component props
 * @returns Preview element
 */
export function TextDocumentPreview(props: TextDocumentPreviewProps) {
  const { asset } = props
  const { allAssets } = useStudio()
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const content = await parseTextDocument(asset)
        const baseAsset = getTextDocumentBaseAsset(asset, allAssets)
        if (!content || !baseAsset) {
          if (active) setImage(null)
          return
        }

        const blob = await renderTextDocument(baseAsset, content)
        const img = await blobToImage(blob)
        if (active) setImage(img)
      } catch {
        if (active) setImage(null)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [allAssets, asset])

  return <div className={`relative h-full ${image ? 'studio-checkerboard' : 'bg-white'}`}>{image && <PreviewPane image={image} transparentBackground />}</div>
}
