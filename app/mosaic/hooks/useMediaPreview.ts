import { useRef, useEffect, useCallback } from 'react'
import { cloneSchema, adjustSchemaForSpacing, drawBackground, drawMedia, drawPlaceholder } from '@/app/mosaic/services/layout'
import type { ImageElement, LayoutSchema, MediaObject, MediaType } from '@/app/mosaic/types'
import { processFileToUrl } from '@/app/mosaic/services/processFileToUrl'
import { useRafController } from '@/hooks/useRafController'

export interface UseMediaPreviewOptions {
  schema?: LayoutSchema
  mediaItems?: MediaObject[]
  setMediaItems?: (mediaItems: MediaObject[] | ((prev: MediaObject[]) => MediaObject[])) => void
  spacing?: number
  padding?: number
  canvasWidth?: number
  canvasHeight?: number
}

export interface MediaTarget {
  type: MediaType
  node: HTMLImageElement | HTMLVideoElement
}

export function useMediaPreview(props: UseMediaPreviewOptions) {
  const { schema, mediaItems, setMediaItems, spacing = schema?.spacing, padding = schema?.padding, canvasWidth = 600, canvasHeight = 600 } = props

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaTargetsRef = useRef<Record<string, MediaTarget>>({})
  const { add: addRaf, clear: clearRafs } = useRafController()

  const drawPreview = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      throw new Error('canvas is not found')
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('canvas is not support')
    }

    if (!schema) {
      throw new Error('schame is required')
    }

    // 设置画布尺寸 - 600x600 用于预览
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // 使用schema中的默认间隔调整布局
    const adjustedSchema = adjustSchemaForSpacing({ schema, spacing })

    // 获取当前布局配置
    const fullLayoutSchema = cloneSchema(adjustedSchema)
    fullLayoutSchema.canvasWidth = canvasWidth
    fullLayoutSchema.canvasHeight = canvasHeight

    // 绘制背景
    drawBackground(ctx, fullLayoutSchema)

    return {
      adjustedSchema: fullLayoutSchema,
      drawMedia(element: ImageElement, media: HTMLVideoElement | HTMLImageElement) {
        ctx.save()
        drawMedia(ctx, media, element, canvasWidth, canvasHeight, padding)
        ctx.restore()
      },
      drawPlaceholder(element: ImageElement) {
        ctx.save()
        drawPlaceholder(ctx, element, canvasWidth, canvasHeight, padding)
        ctx.restore()
      },
    }
  }

  const loadImage = (src: string) => {
    if (mediaTargetsRef.current[src]) {
      return mediaTargetsRef.current[src].node
    }

    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        resolve(image)
      }

      image.onerror = (error) => {
        reject(error)
      }

      image.src = src
      mediaTargetsRef.current[src] = {
        type: 'image',
        node: image,
      }
    })
  }

  const loadVideo = (src: string) => {
    if (mediaTargetsRef.current[src]) {
      return mediaTargetsRef.current[src].node
    }

    return new Promise<HTMLVideoElement>((resolve, reject) => {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.loop = true

      video.onloadedmetadata = () => {
        if (video.readyState === 1) {
          video.width = video.videoWidth
          video.height = video.videoHeight
        }
      }

      video.oncanplay = async () => {
        try {
          await video.play()
          resolve(video)
        } catch (error) {
          reject(error)
        }
      }

      video.onerror = (error) => {
        reject(error)
      }

      video.src = src
      mediaTargetsRef.current[src] = {
        type: 'video',
        node: video,
      }
    })
  }

  const clearUselessMedias = () => {
    if (!mediaItems) {
      return
    }

    const mediaEntries = Object.entries(mediaTargetsRef.current)
    for (const [src, item] of mediaEntries) {
      if (mediaItems.some((item) => item.src === src)) {
        continue
      }

      item.type === 'video' && (item.node as HTMLVideoElement).pause()
      src && URL.revokeObjectURL(src)
      delete mediaTargetsRef.current[src]
    }
  }

  const loadAndDrawMedias = () => {
    if (!schema) {
      return
    }

    const { adjustedSchema, drawMedia, drawPlaceholder } = drawPreview()
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

          drawMedia(element, video)
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
  }

  const select = useCallback(async (index: number, file: File) => {
    if (typeof setMediaItems !== 'function') {
      return
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
  }, [])

  useEffect(() => {
    clearUselessMedias()
    loadAndDrawMedias()
  }, [schema, mediaItems, spacing, padding])

  useEffect(() => {
    return () => {
      clearUselessMedias()
    }
  }, [])

  return { canvasRef, select }
}
