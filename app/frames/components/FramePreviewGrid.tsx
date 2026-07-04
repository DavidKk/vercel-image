'use client'

import { useCallback, useEffect, useRef } from 'react'

import type { ExtractedFrame } from '../core/types'

interface FramePreviewGridProps {
  /** Extracted frames to display */
  frames: ExtractedFrame[]
  /** Currently selected frame id */
  selectedId: string | null
  /** Called when a frame is selected */
  onSelect: (id: string) => void
  /** Optional CSS class */
  className?: string
}

interface FrameCardProps {
  frame: ExtractedFrame
  isSelected: boolean
  onSelect: (id: string) => void
}

/**
 * Single frame thumbnail card
 */
function FrameCard(props: FrameCardProps) {
  const { frame, isSelected, onSelect } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const renderThumbnail = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 200
    canvas.width = size
    canvas.height = size

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const img = frame.image
    const srcWidth = img.naturalWidth || img.width
    const srcHeight = img.naturalHeight || img.height
    const scale = Math.min(size / srcWidth, size / srcHeight)
    const drawWidth = srcWidth * scale
    const drawHeight = srcHeight * scale
    const offsetX = (size - drawWidth) / 2
    const offsetY = (size - drawHeight) / 2

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
  }, [frame.image])

  useEffect(() => {
    renderThumbnail()
  }, [renderThumbnail])

  return (
    <button
      type="button"
      onClick={() => onSelect(frame.id)}
      className={`group relative flex flex-col rounded-lg border-2 overflow-hidden transition-all duration-200 text-left ${
        isSelected ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="relative bg-gray-50 aspect-square flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      </div>
      <div className="p-2 bg-white border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700">#{frame.index + 1}</p>
        <p className="text-[10px] text-gray-500">{frame.timestamp}ms</p>
      </div>
    </button>
  )
}

/**
 * Grid layout for previewing extracted video frames
 * @param props Component props
 * @returns Frame preview grid
 */
export function FramePreviewGrid(props: FramePreviewGridProps) {
  const { frames, selectedId, onSelect, className } = props

  if (frames.length === 0) return null

  return (
    <div className={`w-full h-full overflow-auto p-6 ${className || ''}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {frames.map((frame) => (
          <FrameCard key={frame.id} frame={frame} isSelected={selectedId === frame.id} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
