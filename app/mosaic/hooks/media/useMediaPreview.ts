import { useRef, useCallback, useState, useMemo } from 'react'
import type { LayoutSchema, MediaObject } from '@/app/mosaic/types'
import { processFileToUrl } from '@/app/mosaic/services/processFileToUrl'
import { mergeRefs } from '@/utils/refs'
import { useMediaOffset } from './useMediaOffset'
import { useDragHandler } from './useDragHandler'
import { useMediaDisplay } from './useMediaDisplay'

// 定义媒体预览选项类型
export interface UseMediaPreviewOptions {
  schema?: LayoutSchema
  mediaItems?: MediaObject[]
  setMediaItems?: (mediaItems: MediaObject[] | ((prev: MediaObject[]) => MediaObject[])) => void
  spacing?: number
  padding?: number
  canvasWidth?: number
  canvasHeight?: number
}

export function useMediaPreview(props: UseMediaPreviewOptions) {
  const { schema, mediaItems, setMediaItems, spacing = schema?.spacing, padding = schema?.padding, canvasWidth, canvasHeight } = props

  // 添加状态用于触发重新渲染
  const [offsetVersion, setOffsetVersion] = useState(0)

  // 媒体偏移处理
  const { getMediaOffset, setMediaOffset, resetMediaOffset } = useMediaOffset({
    schema,
    onUpdate: () => {
      // 媒体偏移更新时，增加版本号以触发重新渲染
      setOffsetVersion((prev) => prev + 1)
    },
  })

  // 使用展示 Hook 处理媒体展示，传入偏移获取函数和版本号
  const { canvasRef: displayCanvasRef, getCanvas } = useMediaDisplay({
    schema,
    mediaItems,
    spacing,
    padding,
    canvasWidth,
    canvasHeight,
    getMediaOffset,
    offsetVersion,
  })

  const dragOccurredRef = useRef(false)
  const offsetXRef = useRef<number>(0)
  const offsetYRef = useRef<number>(0)
  const { draggerRef } = useDragHandler({
    schema,
    onDragStart: (elementIndex) => {
      dragOccurredRef.current = false

      const offset = getMediaOffset(elementIndex)
      offsetXRef.current = offset.x
      offsetYRef.current = offset.y
    },
    onDragMove: (elementIndex, offsetX, offsetY) => {
      dragOccurredRef.current = true

      setMediaOffset(elementIndex, offsetXRef.current + offsetX, offsetYRef.current + offsetY)
    },
  })

  const select = useCallback(
    async (index: number, file: File) => {
      if (dragOccurredRef.current) {
        return
      }

      if (typeof setMediaItems !== 'function') {
        return
      }

      // 验证索引是否有效
      if (!schema || index < 0 || index >= schema.elements.length) {
        throw new Error(`Invalid index ${index}. Schema has ${schema?.elements.length || 0} elements.`)
      }

      const { fileUrl, mediaType } = await processFileToUrl(file)
      setMediaItems((mediaItems) => {
        const newMediaItems = [...mediaItems]
        newMediaItems[index] = {
          type: mediaType,
          src: fileUrl,
        }

        return newMediaItems
      })

      // 当新添加图片或视频时，将其偏移位置重置为0
      resetMediaOffset(index)
    },
    [mediaItems, setMediaItems, resetMediaOffset, schema]
  )

  const isDragOccurred = useCallback(() => dragOccurredRef.current, [])
  const attachCanvas = useMemo(() => mergeRefs(displayCanvasRef, draggerRef), [])
  return { attachCanvas, select, getCanvas, isDragOccurred }
}
