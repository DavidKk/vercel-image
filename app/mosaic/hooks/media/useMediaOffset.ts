import { useCallback, useRef, useEffect } from 'react'
import type { LayoutSchema } from '@/app/mosaic/types'


export type MediaOffset = {
  x: number
  y: number
}

// 定义媒体偏移选项类型
export interface UseMediaOffsetOptions {
  schema?: LayoutSchema
  onUpdate?: (index: number | null, offset: MediaOffset | null, offsets: Record<number, MediaOffset>) => void
}

export function useMediaOffset(options: UseMediaOffsetOptions = {}) {
  const { schema, onUpdate } = options
  const offsetsRef = useRef<Record<number, MediaOffset>>({})
  const onUpdateRef = useRef(onUpdate)

  // 当 schema 变更时，重置所有偏移量
  useEffect(() => {
    offsetsRef.current = {}
    // 触发更新回调，schema 变更时 index 为 null
    onUpdateRef.current?.(null, null, { ...offsetsRef.current })
  }, [schema])

  // 更新 onUpdateRef 当依赖项变化时
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // 验证索引是否有效
  const isValidIndex = useCallback((index: number) => {
    if (!schema) return false
    return index >= 0 && index < schema.elements.length
  }, [schema])

  // 通过索引设置媒体的偏移位置
  const setMediaOffset = useCallback(
    (index: number, offsetX: number, offsetY: number) => {
      // 验证索引是否有效
      if (!isValidIndex(index)) {
        throw new Error(`Invalid index ${index}. Schema has ${schema?.elements.length || 0} elements.`)
      }

      offsetsRef.current[index] = { x: offsetX, y: offsetY }
      // 触发更新回调，传递变更的索引和全部偏移量
      onUpdateRef.current?.(index, offsetsRef.current[index], { ...offsetsRef.current })
    },
    [isValidIndex, schema]
  )

  // 获取媒体的偏移位置
  const getMediaOffset = useCallback(
    (index: number) => {
      // 验证索引是否有效
      if (!isValidIndex(index)) {
        throw new Error(`Invalid index ${index}. Schema has ${schema?.elements.length || 0} elements.`)
      }

      return offsetsRef.current[index] || { x: 0, y: 0 }
    },
    [isValidIndex, schema]
  )

  // 重置指定媒体的偏移位置
  const resetMediaOffset = useCallback(
    (index: number) => {
      // 验证索引是否有效
      if (!isValidIndex(index)) {
        throw new Error(`Invalid index ${index}. Schema has ${schema?.elements.length || 0} elements.`)
      }

      const nextOffset = { x: 0, y: 0 }
      offsetsRef.current[index] = nextOffset
      onUpdateRef.current?.(index, nextOffset, { ...offsetsRef.current })
    },
    [isValidIndex, schema]
  )

  // 重置所有媒体的偏移位置
  const resetAllMediaOffsets = useCallback(() => {
    offsetsRef.current = {}
    onUpdateRef.current?.(null, null, { ... offsetsRef.current })
  }, [])

  return {
    setMediaOffset,
    getMediaOffset,
    resetMediaOffset,
    resetAllMediaOffsets,
  }
}