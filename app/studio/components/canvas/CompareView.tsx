'use client'

/**
 * Side-by-side compare view: original vs processed
 */
import { useEffect, useState } from 'react'

import { PreviewPane } from '@/app/progress/components/PreviewPane'
import { blobToImage } from '@/lib/image/canvas'
import { isTextDocumentAsset } from '@/lib/studio/asset-helpers'
import { parseTextDocument, renderTextDocument } from '@/lib/studio/text-document'
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

    async function load() {
      try {
        const left = await blobToImage(parent.blob)
        let right: HTMLImageElement
        if (isTextDocumentAsset(asset)) {
          const content = await parseTextDocument(asset)
          if (!content) throw new Error('Invalid text document')
          const blob = await renderTextDocument(parent, content)
          right = await blobToImage(blob)
        } else {
          right = await blobToImage(asset.blob)
        }
        if (active) {
          setLeftImage(left)
          setRightImage(right)
        }
      } catch {
        if (active) {
          setLeftImage(null)
          setRightImage(null)
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [asset, parent])

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col border-r border-[var(--studio-surface-border)]">
        <div className="border-b border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)]/90 px-4 py-2 text-xs font-medium text-[var(--studio-surface-fg-muted)]">
          Original
        </div>
        <div className={`flex-1 ${leftImage ? 'studio-checkerboard' : 'bg-[var(--studio-canvas-bg)]'}`}>{leftImage && <PreviewPane image={leftImage} transparentBackground />}</div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="border-b border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)]/90 px-4 py-2 text-xs font-medium text-[var(--studio-surface-fg-muted)]">
          Processed
        </div>
        <div className={`flex-1 ${rightImage ? 'studio-checkerboard' : 'bg-[var(--studio-canvas-bg)]'}`}>
          {rightImage && <PreviewPane image={rightImage} transparentBackground />}
        </div>
      </div>
    </div>
  )
}
