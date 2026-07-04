'use client'

/**
 * Zone E: frame timeline and asset count at the editor bottom
 */
import { useCallback, useEffect, useRef } from 'react'

import { getAssetObjectUrl } from '@/lib/studio/asset-helpers'

import { useStudio } from '../../context/StudioContext'

/**
 * Studio bottom bar with timeline and asset count
 * @returns Bottom bar element
 */
export function QueueBar() {
  const { assets, selectedIds, frameAssets, toggleSelect, multiSelectMode } = useStudio()
  const stripRef = useRef<HTMLDivElement>(null)

  const showTimeline = frameAssets.length > 0

  const renderFrameThumb = useCallback((assetId: string, blob: Blob, canvas: HTMLCanvasElement) => {
    const url = getAssetObjectUrl(assetId, blob)
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const size = 64
      canvas.width = size
      canvas.height = size
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, size, size)
      const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
    }
    img.src = url
  }, [])

  return (
    <footer className="flex shrink-0 flex-col border-t border-[var(--studio-panel-border)] bg-white">
      {showTimeline && (
        <div className="flex h-20 items-center gap-2 overflow-hidden border-b border-gray-100 px-3 py-2">
          <span className="w-14 shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400">Timeline</span>
          <div ref={stripRef} className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
            {frameAssets
              .sort((a, b) => ((a.meta?.timestampMs as number) ?? 0) - ((b.meta?.timestampMs as number) ?? 0))
              .map((frame) => (
                <FrameThumb
                  key={frame.id}
                  assetId={frame.id}
                  blob={frame.blob}
                  timestampMs={(frame.meta?.timestampMs as number) ?? 0}
                  isSelected={selectedIds.includes(frame.id)}
                  onSelect={() => toggleSelect(frame.id, true)}
                  renderThumb={renderFrameThumb}
                />
              ))}
          </div>
        </div>
      )}

      <div className="flex min-h-9 shrink-0 items-center px-3 py-1.5 text-xs text-gray-500">
        {assets.length} assets
        {multiSelectMode ? ` · ${selectedIds.length} selected` : ''}
      </div>
    </footer>
  )
}

interface FrameThumbProps {
  assetId: string
  blob: Blob
  timestampMs: number
  isSelected: boolean
  onSelect: () => void
  renderThumb: (id: string, blob: Blob, canvas: HTMLCanvasElement) => void
}

function FrameThumb(props: FrameThumbProps) {
  const { assetId, blob, timestampMs, isSelected, onSelect, renderThumb } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) renderThumb(assetId, blob, canvasRef.current)
  }, [assetId, blob, renderThumb])

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex shrink-0 flex-col items-center gap-0.5 rounded border-2 transition-colors ${isSelected ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'}`}
    >
      <canvas ref={canvasRef} className="h-14 w-14 rounded" />
      <span className="text-[9px] text-gray-400">{timestampMs}ms</span>
    </button>
  )
}
