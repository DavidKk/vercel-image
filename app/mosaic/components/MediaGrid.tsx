'use client'

import { useRef } from 'react'
import { detectClickPosition, cloneSchema } from '@/app/mosaic/services/layout'
import { useMediaPreview, type UseMediaPreviewOptions } from '@/app/mosaic/hooks/useMediaPreview'

export interface MediaGridProps extends UseMediaPreviewOptions {}

export default function MediaGrid(props: MediaGridProps) {
  const { schema, mediaItems, setMediaItems, spacing, padding } = props
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { canvasRef, select } = useMediaPreview({ schema, mediaItems, setMediaItems, spacing, padding })

  // 处理文件选择
  const handleFileSelect = (index: number) => {
    if (!fileInputRef.current) {
      return
    }

    fileInputRef.current.onchange = async (event: any) => {
      const file = event.target.files?.[0]
      file && select(index, file)
      event.target.value = ''
    }

    fileInputRef.current.click()
  }

  // 通过Canvas点击上传媒体项
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!schema) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 考虑设备像素比和Canvas缩放
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const scaleX = canvasWidth / rect.width
    const scaleY = canvasHeight / rect.height

    // 调整点击坐标以匹配Canvas内部坐标
    const canvasX = x * scaleX
    const canvasY = y * scaleY

    // 获取当前布局配置
    const fullLayoutSchema = cloneSchema(schema)
    fullLayoutSchema.canvasWidth = canvasWidth
    fullLayoutSchema.canvasHeight = canvasHeight

    // 直接使用服务函数检测点击位置（需要考虑padding）
    const clickedIndex = detectClickPosition(fullLayoutSchema, canvasX, canvasY)

    // 根据布局配置中的元素数量确定可点击的媒体项索引范围
    const maxIndex = fullLayoutSchema.elements.length - 1

    if (clickedIndex !== null && clickedIndex >= 0 && clickedIndex <= maxIndex) {
      handleFileSelect(clickedIndex)
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-center">
        <canvas ref={canvasRef} className="w-full max-w-md cursor-pointer border border-gray-200" height="600" width="600" onClick={handleCanvasClick} />
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.heic,video/*" />
    </>
  )
}
