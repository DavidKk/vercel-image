'use client'

import { useMediaPreview } from '@/app/mosaic/hooks/useMediaPreview'
import type { LayoutSchema } from '@/app/mosaic/types'

export interface ThumbnailProps {
  schema: LayoutSchema
}

export function Thumbnail(props: ThumbnailProps) {
  const { schema } = props
  const { canvasRef } = useMediaPreview({
    schema,
    canvasWidth: 256,
    canvasHeight: 256,
  })

  return (
    <div className="aspect-square relative bg-gray-100 rounded flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full border border-gray-100" />
    </div>
  )
}
