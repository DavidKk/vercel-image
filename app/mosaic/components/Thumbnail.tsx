'use client'

import type { LayoutSchema } from '@/app/mosaic/types'

import { useMediaDisplay } from '../hooks/media/useMediaDisplay'

export interface ThumbnailProps {
  schema: LayoutSchema
}

export function Thumbnail(props: ThumbnailProps) {
  const { schema } = props
  // 计算保持比例的画布尺寸，最大不超过 256x256
  const maxWidth = 256
  const maxHeight = 256

  // 根据 schema 的宽高比计算实际画布尺寸
  const aspectRatio = schema.canvasWidth / schema.canvasHeight
  let canvasWidth = maxWidth
  let canvasHeight = maxHeight

  if (aspectRatio > 1) {
    // 宽度大于高度，以宽度为准
    canvasHeight = maxWidth / aspectRatio
  } else {
    // 高度大于等于宽度，以高度为准
    canvasWidth = maxHeight * aspectRatio
  }

  const { canvasRef } = useMediaDisplay({
    schema,
    canvasWidth,
    canvasHeight,
  })

  return (
    <div className="aspect-square relative rounded flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
    </div>
  )
}
