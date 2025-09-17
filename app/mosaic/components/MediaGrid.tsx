'use client'

import { useRef, useState } from 'react'
import { detectClickPosition, cloneSchema } from '@/app/mosaic/services/layout'
import { useMediaPreview } from '@/app/mosaic/hooks/media/useMediaPreview'
import { useDragHandler } from '@/app/mosaic/hooks/useDragHandler'
import { processFileToUrl } from '@/app/mosaic/services/processFileToUrl'
import type { MediaObject, LayoutSchema } from '@/app/mosaic/types'

interface MediaGridProps {
  schema?: LayoutSchema
  mediaItems?: MediaObject[]
  setMediaItems?: (mediaItems: MediaObject[] | ((prev: MediaObject[]) => MediaObject[])) => void
  spacing?: number
  padding?: number
}

export default function MediaGrid(props: MediaGridProps) {
  const { schema, mediaItems = [], setMediaItems, spacing, padding } = props
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOccurred, setDragOccurred] = useState(false)
  const { canvasRef, select, getMediaOffset, setMediaOffset } = useMediaPreview({ schema, mediaItems, setMediaItems, spacing, padding })

  const offsetXRef = useRef<number>(0)
  const offsetYRef = useRef<number>(0)
  const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } = useDragHandler({
    schema,
    onDragStart: (elementIndex) => {
      setDragOccurred(false)

      const offset = getMediaOffset(elementIndex)
      offsetXRef.current = offset.x
      offsetYRef.current = offset.y
    },
    onDragMove: (elementIndex, offsetX, offsetY) => {
      setDragOccurred(true)

      setMediaOffset(elementIndex, offsetXRef.current + offsetX, offsetYRef.current + offsetY)
    },
  })

  // 处理文件选择
  const handleFileSelect = (index: number) => {
    if (!fileInputRef.current) {
      return
    }

    fileInputRef.current.onchange = async (event: any) => {
      const files = event.target.files
      if (!files || files.length === 0) {
        return
      }

      // 计算已选中的媒体项数量
      const selectedCount = mediaItems.filter((item) => item.src).length
      // 计算剩余可选位置数量
      const remainingSlots = mediaItems.length - selectedCount

      // 如果没有选中任何图片，则可以选择最多N张图片
      // 如果已经选择了一些图片，则只能选择剩余位置数量的图片
      const maxFiles = selectedCount === 0 ? mediaItems.length : remainingSlots

      // 如果只选择了一个文件，则替换原有位置的图片
      if (files.length === 1) {
        const file = files[0]
        file && select(index, file)
      }
      // 如果选择了多个文件，以补完的形式添加
      else {
        try {
          // 限制文件数量不超过可选位置
          const filesToProcess = Math.min(files.length, maxFiles)

          // 创建新的媒体项数组
          const newMediaItems: MediaObject[] = [...mediaItems]

          // 找到第一个空位置的索引
          let firstEmptyIndex = 0
          if (selectedCount > 0) {
            // 如果已有选中图片，则从第一个空位置开始填充
            for (let i = 0; i < mediaItems.length; i++) {
              if (!newMediaItems[i].src) {
                firstEmptyIndex = i
                break
              }
            }
          }

          // 为每个文件分配一个位置
          const processPromises: Promise<void>[] = []
          for (let i = 0; i < filesToProcess; i++) {
            const targetIndex = selectedCount === 0 ? i : firstEmptyIndex + i
            if (targetIndex < mediaItems.length) {
              processPromises.push(
                processFileToUrl(files[i]).then(({ fileUrl, mediaType }) => {
                  newMediaItems[targetIndex] = {
                    type: mediaType,
                    src: fileUrl,
                  }
                })
              )
            }
          }

          // 等待所有文件处理完成
          await Promise.all(processPromises)

          setMediaItems && setMediaItems(newMediaItems)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to process files:', error)
        }
      }

      event.target.value = ''
    }

    fileInputRef.current.click()
  }

  // 通过Canvas点击上传媒体项
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 如果发生了拖动，则不处理点击事件
    if (dragOccurred) {
      // 重置拖动状态
      setDragOccurred(false)
      return
    }

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
      {/* 修改容器类以支持响应式设计，移除固定宽高，使用响应式尺寸 */}
      <div className="mb-6 flex justify-center w-full">
        <canvas
          ref={canvasRef}
          className="w-full max-w-md md:max-w-lg cursor-pointer border border-gray-200"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.heic,video/*" multiple />
    </>
  )
}
