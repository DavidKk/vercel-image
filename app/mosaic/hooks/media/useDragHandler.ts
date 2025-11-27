import { useCallback, useEffect, useRef, useState } from 'react'

import { cloneSchema, detectClickPosition } from '@/app/mosaic/services/layout'
import type { LayoutSchema } from '@/app/mosaic/types'

export type DragHandler = (elementIndex: number, offsetX: number, offsetY: number) => void

export interface UseDragHandlerOptions {
  schema?: LayoutSchema
  onDragStart?: DragHandler
  onDragMove?: DragHandler
  onDragEnd?: DragHandler
}

export function useDragHandler(options: UseDragHandlerOptions) {
  const draggerRef = useRef<HTMLCanvasElement>(null)
  const schemaRef = useRef<LayoutSchema | undefined>(options.schema)
  const onDragStartRef = useRef<DragHandler>(options.onDragStart)
  const onDragMoveRef = useRef<DragHandler>(options.onDragMove)
  const onDragEndRef = useRef<DragHandler>(options.onDragEnd)

  useEffect(() => {
    schemaRef.current = options.schema
    onDragStartRef.current = options.onDragStart
    onDragMoveRef.current = options.onDragMove
    onDragEndRef.current = options.onDragEnd
  }, [options.schema, options.onDragStart, options.onDragMove, options.onDragEnd])

  // 拖拽状态
  const dragStateRef = useRef({
    isDragging: false,
    elementIndex: null as number | null,
    startX: 0,
    startY: 0,
    hasMoved: false,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [elementIndex, setElementIndex] = useState<number | null>(null)

  // requestAnimationFrame 节流
  const frameRef = useRef<number | null>(null)

  // 工具函数：获取 canvas 内部坐标
  const getCanvasCoords = (event: MouseEvent | TouchEvent) => {
    const canvas = draggerRef.current!
    const rect = canvas.getBoundingClientRect()

    const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return { canvasX: x * scaleX, canvasY: y * scaleY }
  }

  const handleMove = useCallback((event: MouseEvent | TouchEvent) => {
    const schema = schemaRef.current
    if (!schema) {
      return
    }

    const state = dragStateRef.current
    if (!state.isDragging || state.elementIndex === null) {
      return
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    frameRef.current = requestAnimationFrame(() => {
      const { canvasX, canvasY } = getCanvasCoords(event)

      const element = schema.elements[state.elementIndex!]
      const onlyX = element.dragDirection === 'horizontal'
      const onlyY = element.dragDirection === 'vertical'

      const offsetX = onlyY ? 0 : canvasX - state.startX
      const offsetY = onlyX ? 0 : canvasY - state.startY

      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
      if (distance > 5) {
        state.hasMoved = true
      }

      if (state.hasMoved && state.elementIndex !== null) {
        try {
          onDragMoveRef.current!(state.elementIndex, offsetX, offsetY)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }
      }
    })
  }, [])

  const handleUp = useCallback((event: MouseEvent | TouchEvent) => {
    const state = dragStateRef.current
    if (!state.isDragging || state.elementIndex === null) {
      return
    }

    const { canvasX, canvasY } = getCanvasCoords(event)
    const offsetX = canvasX - state.startX
    const offsetY = canvasY - state.startY

    try {
      onDragEndRef.current?.(state.elementIndex, offsetX, offsetY)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }

    dragStateRef.current = {
      isDragging: false,
      elementIndex: null,
      startX: 0,
      startY: 0,
      hasMoved: false,
    }

    setIsDragging(false)
    setElementIndex(null)

    removeWindowListeners()
  }, [])

  const handleDown = useCallback((event: MouseEvent | TouchEvent) => {
    const schema = schemaRef.current
    if (!schema) {
      return
    }

    const { canvasX, canvasY } = getCanvasCoords(event)

    const fullLayoutSchema = cloneSchema(schema)
    fullLayoutSchema.canvasWidth = draggerRef.current!.width
    fullLayoutSchema.canvasHeight = draggerRef.current!.height

    const clickedIndex = detectClickPosition(fullLayoutSchema, canvasX, canvasY)
    if (clickedIndex === null || clickedIndex < 0 || clickedIndex >= fullLayoutSchema.elements.length) {
      return
    }

    const element = schema.elements[clickedIndex!]
    if (element.draggable !== true) {
      return
    }

    dragStateRef.current = {
      isDragging: true,
      elementIndex: clickedIndex,
      startX: canvasX,
      startY: canvasY,
      hasMoved: false,
    }

    setIsDragging(true)
    setElementIndex(clickedIndex)

    try {
      onDragStartRef.current?.(clickedIndex, 0, 0)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }

    addWindowListeners()
  }, [])

  // 统一管理 window 事件
  const addWindowListeners = () => {
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)
  }

  const removeWindowListeners = () => {
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
    window.removeEventListener('touchmove', handleMove)
    window.removeEventListener('touchend', handleUp)
  }

  // 初始绑定 mousedown/touchstart
  useEffect(() => {
    const canvas = draggerRef.current
    if (!canvas) {
      return
    }

    canvas.addEventListener('mousedown', handleDown)
    canvas.addEventListener('touchstart', handleDown)

    return () => {
      canvas.removeEventListener('mousedown', handleDown)
      canvas.removeEventListener('touchstart', handleDown)
      removeWindowListeners()
    }
  }, [handleDown])

  const reset = useCallback(() => {
    dragStateRef.current = {
      isDragging: false,
      elementIndex: null,
      startX: 0,
      startY: 0,
      hasMoved: false,
    }

    setIsDragging(false)
    setElementIndex(null)
    removeWindowListeners()
  }, [])

  const hasDragged = useCallback(() => dragStateRef.current.hasMoved, [])
  return { draggerRef, isDragging, elementIndex, hasDragged, reset }
}
