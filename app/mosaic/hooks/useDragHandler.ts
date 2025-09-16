import { useRef, useCallback } from 'react'
import { detectClickPosition, cloneSchema } from '@/app/mosaic/services/layout'
import type { LayoutSchema } from '@/app/mosaic/types'

export interface UseDragHandlerOptions {
  schema?: LayoutSchema
  onDragStart?: (elementIndex: number, offsetX: number, offsetY: number) => void
  onDragMove?: (elementIndex: number, offsetX: number, offsetY: number) => void
  onDragEnd?: (elementIndex: number, offsetX: number, offsetY: number) => void
}

export function useDragHandler(options: UseDragHandlerOptions) {
  const { schema, onDragStart, onDragMove, onDragEnd } = options
  const dragStateRef = useRef<{
    isDragging: boolean
    elementIndex: number | null
    startX: number
    startY: number
    // 添加一个标志来标识是否已经移动过
    hasMoved: boolean
  }>({
    isDragging: false,
    elementIndex: null,
    startX: 0,
    startY: 0,
    hasMoved: false,
  })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!schema) {
        return
      }

      const canvas = e.currentTarget
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

      // 直接使用服务函数检测点击位置
      const clickedIndex = detectClickPosition(fullLayoutSchema, canvasX, canvasY)

      // 根据布局配置中的元素数量确定可点击的媒体项索引范围
      const maxIndex = fullLayoutSchema.elements.length - 1

      if (clickedIndex !== null && clickedIndex >= 0 && clickedIndex <= maxIndex) {
        // 设置拖动状态
        dragStateRef.current = {
          isDragging: true,
          elementIndex: clickedIndex,
          startX: canvasX,
          startY: canvasY,
          hasMoved: false, // 初始化为未移动
        }

        // 调用拖动开始回调
        onDragStart?.(clickedIndex, 0, 0)
      }
    },
    [schema, onDragStart]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragStateRef.current.isDragging || dragStateRef.current.elementIndex === null) {
        return
      }

      const canvas = e.currentTarget
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

      // 计算偏移量
      const offsetX = canvasX - dragStateRef.current.startX
      const offsetY = canvasY - dragStateRef.current.startY

      // 检查是否已经移动（超过一定距离才认为是拖动）
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
      if (distance > 5) {
        // 最小拖动距离为5像素
        dragStateRef.current.hasMoved = true
      }

      // 只有在确认移动后才调用拖动移动回调
      if (dragStateRef.current.hasMoved) {
        // 调用拖动移动回调
        onDragMove?.(dragStateRef.current.elementIndex, offsetX, offsetY)
      }
    },
    [onDragMove]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragStateRef.current.isDragging || dragStateRef.current.elementIndex === null) {
        return
      }

      const canvas = e.currentTarget
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

      // 计算偏移量
      const offsetX = canvasX - dragStateRef.current.startX
      const offsetY = canvasY - dragStateRef.current.startY

      // 调用拖动结束回调
      onDragEnd?.(dragStateRef.current.elementIndex, offsetX, offsetY)

      // 重置拖动状态
      dragStateRef.current = {
        isDragging: false,
        elementIndex: null,
        startX: 0,
        startY: 0,
        hasMoved: false,
      }
    },
    [onDragEnd]
  )

  const handleMouseLeave = useCallback(() => {
    if (!dragStateRef.current.isDragging || dragStateRef.current.elementIndex === null) {
      return
    }

    // 如果鼠标离开canvas，结束拖动
    onDragEnd?.(dragStateRef.current.elementIndex, 0, 0)

    // 重置拖动状态
    dragStateRef.current = {
      isDragging: false,
      elementIndex: null,
      startX: 0,
      startY: 0,
      hasMoved: false,
    }
  }, [onDragEnd])

  // 添加一个函数来检查是否发生了拖动
  const hasDragged = useCallback(() => {
    return dragStateRef.current.hasMoved
  }, [])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    hasDragged, // 返回这个函数供外部使用
  }
}
