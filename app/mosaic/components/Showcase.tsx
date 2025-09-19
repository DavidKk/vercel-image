'use client'

import { useState, useEffect, useRef } from 'react'
import type { LayoutSchema, MediaObject } from '@/app/mosaic/types'
import { useMediaDisplay } from '@/app/mosaic/hooks/media/useMediaDisplay'
import { Spinner } from '@/components/Spinner'

export interface ShowcaseItem {
  schema: LayoutSchema
  mediaItems: MediaObject[]
}

export interface ShowcaseProps {
  items: ShowcaseItem[]
  /** 切换间隔时间（毫秒），默认3000ms */
  interval?: number
  /** 画布宽度，默认600 */
  canvasWidth?: number
  /** 画布高度，默认600 */
  canvasHeight?: number
  /** 过渡动画持续时间（毫秒），默认800ms */
  transitionDuration?: number
}

export function Showcase(props: ShowcaseProps) {
  const { items, interval = 5000, canvasWidth = 600, canvasHeight = 600, transitionDuration = 1600 } = props

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 使用 useMediaDisplay 钩子来处理当前媒体展示
  const { canvasRef } = useMediaDisplay({
    schema: items[currentIndex]?.schema,
    mediaItems: items[currentIndex]?.mediaItems,
    canvasWidth,
    canvasHeight,
  })

  // 切换到下一个展示项
  const switchToNext = () => {
    if (items.length <= 1) {
      return
    }

    // 开始过渡
    setIsTransitioning(true)

    // 过渡结束后更新当前索引
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
      setIsTransitioning(false)
    }, transitionDuration / 2)
  }

  // 自动切换逻辑
  useEffect(() => {
    intervalIdRef.current = setInterval(() => {
      switchToNext()
    }, interval)

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
      }

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [items.length, interval, transitionDuration])

  return (
    <div className="aspect-square relative rounded flex items-center justify-center overflow-hidden">
      {!items?.length ? (
        <Spinner color="text-purple-600" />
      ) : (
        <canvas ref={canvasRef} className="w-full h-full" style={{ transition: `opacity ${transitionDuration / 2}ms ease-in-out`, opacity: isTransitioning ? 0 : 1 }} />
      )}
    </div>
  )
}
