import { useRef, useEffect, useCallback, useState } from 'react'
import { cloneSchema, adjustSchemaForSpacing, drawBackground, drawMedia, drawPlaceholder } from '@/app/mosaic/services/layout'
import type { ImageElement, LayoutSchema, MediaObject } from '@/app/mosaic/types'
import type { MediaTarget } from './types'
import { processFileToUrl } from '@/app/mosaic/services/processFileToUrl'
import { useRafController } from '@/hooks/useRafController'
import { useMediaOffset } from './useMediaOffset'

// 定义媒体预览选项类型
interface UseMediaPreviewOptions {
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaTargetsRef = useRef<Record<string, MediaTarget>>({})
  const loadingPromisesRef = useRef<Record<string, Promise<HTMLImageElement | HTMLVideoElement> | undefined>>({})
  const { add: addRaf, clear: clearRafs } = useRafController()

  // 添加状态来跟踪容器宽度
  const [containerWidth, setContainerWidth] = useState(600)

  // 计算响应式 Canvas 尺寸
  const getResponsiveCanvasSize = useCallback(() => {
    // 如果传入了 canvasWidth 和 canvasHeight，则使用传入的值
    if (canvasWidth && canvasHeight) {
      return { width: canvasWidth, height: canvasHeight }
    }

    // 否则使用响应式尺寸，但根据 schema 的宽高比进行调整
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth
      let width = 0

      if (screenWidth < 768) {
        // 移动端
        width = Math.min(screenWidth - 32, 400) // 减去左右 padding
      } else if (screenWidth < 1024) {
        // 平板
        width = 500
      } else {
        // 桌面端
        width = 600
      }

      // 根据 schema 的宽高比计算高度
      if (schema) {
        const aspectRatio = schema.canvasHeight / schema.canvasWidth
        const height = width * aspectRatio
        return { width, height }
      }

      // 如果没有 schema，使用 1:1 的默认比例
      return { width, height: width }
    }
    return { width: 600, height: 600 } // 默认尺寸
  }, [canvasWidth, canvasHeight, schema])

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      // 只有在没有传入固定尺寸时才更新
      if (!canvasWidth || !canvasHeight) {
        setContainerWidth(getResponsiveCanvasSize().width)
      }
    }

    // 初始化尺寸
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveCanvasSize, canvasWidth, canvasHeight])

  const drawPreview = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      // 如果 canvas 还未挂载，不抛出错误而是静默返回
      return null
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('canvas is not support')
    }

    if (!schema) {
      throw new Error('schema is required')
    }

    // 使用传入的尺寸或响应式尺寸
    const responsiveSize = getResponsiveCanvasSize()
    const finalCanvasWidth = canvasWidth || responsiveSize.width
    const finalCanvasHeight = canvasHeight || responsiveSize.height

    // 设置画布尺寸
    canvas.width = finalCanvasWidth
    canvas.height = finalCanvasHeight

    // 使用schema中的默认间隔调整布局
    const adjustedSchema = adjustSchemaForSpacing({ schema, spacing })

    // 获取当前布局配置
    const fullLayoutSchema = cloneSchema(adjustedSchema)
    fullLayoutSchema.canvasWidth = finalCanvasWidth
    fullLayoutSchema.canvasHeight = finalCanvasHeight

    // 绘制背景
    drawBackground(ctx, fullLayoutSchema)

    return {
      adjustedSchema: fullLayoutSchema,
      drawMedia(element: ImageElement, media: HTMLVideoElement | HTMLImageElement) {
        ctx.save()
        // 应用媒体的偏移位置
        const elementIndex = adjustedSchema.elements.indexOf(element)
        if (elementIndex !== -1) {
          const offset = getMediaOffset(elementIndex)
          if (offset.x !== 0 || offset.y !== 0) {
            ctx.translate(offset.x, offset.y)
          }
        }

        drawMedia(ctx, media, element, finalCanvasWidth, finalCanvasHeight, padding)
        ctx.restore()
      },
      drawPlaceholder(element: ImageElement) {
        ctx.save()
        // 应用媒体的偏移位置
        const elementIndex = adjustedSchema.elements.indexOf(element)
        if (elementIndex !== -1) {
          const offset = getMediaOffset(elementIndex)
          if (offset.x !== 0 || offset.y !== 0) {
            ctx.translate(offset.x, offset.y)
          }
        }

        drawPlaceholder(ctx, element, finalCanvasWidth, finalCanvasHeight, padding)
        ctx.restore()
      },
    }
  }

  const loadImage = (src: string) => {
    const cache = mediaTargetsRef.current[src]
    // 如果已经加载过该图片，直接返回
    if (cache) {
      return Promise.resolve(cache.node)
    }

    // 如果正在加载该图片，返回已存在的 Promise
    if (loadingPromisesRef.current[src]) {
      return loadingPromisesRef.current[src]!
    }

    // 创建新的加载 Promise 并记录
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        // 加载完成后，从加载状态中移除
        delete loadingPromisesRef.current[src]
        resolve(image)
      }

      image.onerror = (error) => {
        // 加载失败时，从加载状态中移除
        delete loadingPromisesRef.current[src]
        reject(error)
      }

      image.src = src
      mediaTargetsRef.current[src] = {
        type: 'image',
        node: image,
        offsetX: 0, // 初始化偏移位置
        offsetY: 0,
      }
    })

    // 记录加载状态
    loadingPromisesRef.current[src] = promise
    return promise
  }

  const loadVideo = (src: string) => {
    const cache = mediaTargetsRef.current[src]
    // 如果已经加载过该视频，直接返回
    if (cache) {
      return Promise.resolve(cache.node)
    }

    // 如果正在加载该视频，返回已存在的 Promise
    if (loadingPromisesRef.current[src]) {
      return loadingPromisesRef.current[src]!
    }

    // 创建新的加载 Promise 并记录
    const promise = new Promise<HTMLVideoElement>((resolve, reject) => {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.preload = 'metadata' // 改为metadata，减少初始加载
      video.loop = true
      video.controls = false // 确保不显示控件

      // 添加事件监听器以处理iOS的限制
      let resolved = false

      const handleCanPlay = async () => {
        if (resolved) return

        try {
          // 尝试播放视频
          await video.play()

          if (!resolved) {
            resolved = true
            // 加载完成后，从加载状态中移除
            delete loadingPromisesRef.current[src]
            resolve(video)
          }
        } catch (playError) {
          // 在iOS上可能因为用户交互限制而失败，但这不应该阻止加载
          // eslint-disable-next-line no-console
          console.warn('Failed to auto-play video (may be due to iOS restrictions):', playError)

          if (!resolved) {
            resolved = true
            // 加载完成后，从加载状态中移除
            delete loadingPromisesRef.current[src]
            resolve(video)
          }
        }
      }

      video.onloadeddata = handleCanPlay
      video.oncanplay = handleCanPlay
      video.oncanplaythrough = handleCanPlay

      video.onloadedmetadata = () => {
        if (video.readyState >= 1) {
          video.width = video.videoWidth || 300 // 设置默认宽度
          video.height = video.videoHeight || 200 // 设置默认高度
        }
      }

      video.onerror = (error) => {
        if (!resolved) {
          resolved = true
          // 加载失败时，从加载状态中移除
          delete loadingPromisesRef.current[src]
          reject(error)
        }
      }

      // 设置超时处理
      setTimeout(() => {
        if (!resolved && video.readyState >= 1) {
          resolved = true
          delete loadingPromisesRef.current[src]
          resolve(video)
        }
      }, 3000) // 3秒超时

      video.src = src
      mediaTargetsRef.current[src] = {
        type: 'video',
        node: video,
        offsetX: 0, // 初始化偏移位置
        offsetY: 0,
      }
    })

    // 记录加载状态
    loadingPromisesRef.current[src] = promise
    return promise
  }

  const loadAndDrawMedias = useCallback(() => {
    if (!schema) {
      return
    }

    const result = drawPreview()
    // 如果 canvas 还未挂载，直接返回
    if (!result) {
      return
    }

    const { adjustedSchema, drawMedia, drawPlaceholder } = result
    const imageCount = adjustedSchema.elements.length

    const drawImage = async (src: string, element: ImageElement) => {
      try {
        const image = await loadImage(src)
        drawMedia(element, image)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load image', src, error)

        drawPlaceholder(element)
      }
    }

    const drawVideo = async (src: string, element: ImageElement) => {
      try {
        const video = await loadVideo(src)
        const destroy = addRaf(() => {
          if (!mediaTargetsRef.current[src]) {
            destroy()
            return
          }

          // 检查视频是否已准备好播放
          if ((video as HTMLVideoElement).readyState >= 2) {
            drawMedia(element, video)
          } else {
            // 视频未准备好，绘制占位符
            drawPlaceholder(element)
          }
        })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load video', src, error)
        drawPlaceholder(element)
      }
    }

    clearRafs()

    for (let i = 0; i < imageCount; i++) {
      const element = adjustedSchema.elements[i]
      if (!element) {
        continue
      }

      if (!(mediaItems && mediaItems[i] && mediaItems[i].src)) {
        drawPlaceholder(element)
        continue
      }

      const item = mediaItems[i]
      switch (item.type) {
        case 'image':
          drawImage(item.src!, element)
          continue
        case 'video':
          drawVideo(item.src!, element)
          continue
      }
    }
  }, [schema, mediaItems, spacing, padding, containerWidth, canvasWidth, canvasHeight, drawPreview, addRaf, clearRafs])

  const { setMediaOffset, getMediaOffset, resetMediaOffset } = useMediaOffset({
    schema,
    onUpdate: (index, offset) => {
      loadAndDrawMedias()
    },
  })


  const select = useCallback(async (index: number, file: File) => {
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
  }, [mediaItems, setMediaItems, resetMediaOffset, schema])

  
  useEffect(() => {
    loadAndDrawMedias()
  }, [schema, mediaItems, spacing, padding, containerWidth, canvasWidth, canvasHeight])

  return { canvasRef, select, setMediaOffset }
}
