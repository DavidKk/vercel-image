'use client'

import { useCallback, useEffect, useRef } from 'react'

import { Spinner } from '@/components/Spinner'

import type { ImageItem } from '../core/types'

interface BatchPreviewGridProps {
  /** Image items to display in the grid */
  items: ImageItem[]
  /** Currently selected item id */
  selectedId: string | null
  /** Whether to show processed result or original */
  showProcessed: boolean
  /** Called when an item is clicked */
  onSelect: (id: string) => void
  /** Optional CSS class name */
  className?: string
}

/**
 * Draw image or ImageData onto a canvas context, scaled to fit
 * @param ctx Canvas rendering context
 * @param source Image element or ImageData
 * @param width Target canvas width
 * @param height Target canvas height
 */
function drawThumbnail(ctx: CanvasRenderingContext2D, source: HTMLImageElement | ImageData, width: number, height: number): void {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  let srcWidth: number
  let srcHeight: number

  if (source instanceof ImageData) {
    srcWidth = source.width
    srcHeight = source.height
  } else {
    srcWidth = source.naturalWidth || source.width
    srcHeight = source.naturalHeight || source.height
  }

  const scale = Math.min(width / srcWidth, height / srcHeight)
  const drawWidth = srcWidth * scale
  const drawHeight = srcHeight * scale
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  if (source instanceof ImageData) {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = source.width
    tempCanvas.height = source.height
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCtx.putImageData(source, 0, 0)
      ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight)
    }
  } else {
    ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight)
  }
}

interface ThumbnailCardProps {
  item: ImageItem
  isSelected: boolean
  showProcessed: boolean
  onSelect: (id: string) => void
}

/**
 * Single thumbnail card in the batch preview grid
 */
function ThumbnailCard(props: ThumbnailCardProps) {
  const { item, isSelected, showProcessed, onSelect } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const renderThumbnail = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 200
    canvas.width = size
    canvas.height = size

    const source = showProcessed && item.processedImageData ? item.processedImageData : item.image
    drawThumbnail(ctx, source, size, size)
  }, [item, showProcessed])

  useEffect(() => {
    renderThumbnail()
  }, [renderThumbnail])

  const statusLabel = item.status === 'processing' ? 'Processing' : item.status === 'done' ? 'Done' : item.status === 'error' ? 'Failed' : 'Pending'

  const statusColor =
    item.status === 'processing'
      ? 'bg-blue-100 text-blue-700'
      : item.status === 'done'
        ? 'bg-green-100 text-green-700'
        : item.status === 'error'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-600'

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`group relative flex flex-col rounded-lg border-2 overflow-hidden transition-all duration-200 text-left ${
        isSelected ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="relative bg-gray-50 aspect-square flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {item.status === 'processing' && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-2 bg-white border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700 truncate" title={item.file.name}>
          {item.file.name}
        </p>
        <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor}`}>{statusLabel}</span>
      </div>
    </button>
  )
}

/**
 * Grid layout for batch previewing multiple images
 * @param props Component props
 * @returns Batch preview grid element
 */
export function BatchPreviewGrid(props: BatchPreviewGridProps) {
  const { items, selectedId, showProcessed, onSelect, className } = props

  if (items.length === 0) {
    return null
  }

  return (
    <div className={`w-full h-full overflow-auto p-6 ${className || ''}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <ThumbnailCard key={item.id} item={item} isSelected={selectedId === item.id} showProcessed={showProcessed} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
