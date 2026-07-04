'use client'

import { formatBytes } from '@/app/progress/core/utils'

interface GifPreviewProps {
  /** Object URL of the generated GIF */
  previewUrl: string
  /** Number of frames in the GIF */
  frameCount: number
  /** Delay between frames in milliseconds */
  intervalMs: number
  /** GIF file size in bytes */
  sizeBytes: number
  /** Optional CSS class */
  className?: string
}

/**
 * Preview panel for a generated animated GIF
 * @param props Component props
 * @returns GIF preview element
 */
export function GifPreview(props: GifPreviewProps) {
  const { previewUrl, frameCount, intervalMs, sizeBytes, className } = props

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-6 ${className || ''}`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-full max-h-full flex flex-col items-center gap-4">
        <div
          className="relative rounded-lg overflow-hidden border border-gray-100 max-w-full max-h-[calc(100vh-280px)] flex items-center justify-center"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        >
          <img src={previewUrl} alt="Generated GIF preview" className="max-w-full max-h-[calc(100vh-300px)] object-contain block" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-800">GIF Preview</p>
          <p className="text-xs text-gray-500">
            {frameCount} frames · {intervalMs}ms/frame · {formatBytes(sizeBytes)}
          </p>
        </div>
      </div>
    </div>
  )
}
