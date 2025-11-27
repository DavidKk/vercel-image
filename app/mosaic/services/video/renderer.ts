import type { LayoutSchema, MediaObject } from '@/app/mosaic/types'

import { drawBackground, drawMedia, drawPlaceholder } from '../layout'

/**
 * 初始化离屏 Canvas
 * @param width Canvas 宽度
 * @param height Canvas 高度
 * @returns 离屏 Canvas 和上下文
 */
export function initOffscreenCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to create offscreen canvas context')
  }

  return { canvas, ctx }
}

/**
 * 在离屏 Canvas 上渲染媒体内容
 * @param ctx Canvas 上下文
 * @param fullLayoutSchema 布局配置
 * @param mediaItems 媒体项数组
 * @param canvasWidth Canvas 宽度
 * @param canvasHeight Canvas 高度
 * @returns 包含视频元素映射的 Promise
 */
export async function renderOffscreenContent(
  ctx: CanvasRenderingContext2D,
  fullLayoutSchema: LayoutSchema,
  mediaItems: MediaObject[],
  canvasWidth: number,
  canvasHeight: number
): Promise<Map<string, HTMLVideoElement>> {
  // 绘制背景
  drawBackground(ctx, fullLayoutSchema)

  // 创建视频元素映射用于后续播放
  const videoElementMap = new Map<string, HTMLVideoElement>()

  // 创建一个 Promise 数组来跟踪所有媒体的加载
  const mediaPromises: Promise<void>[] = []

  // 根据布局配置中的元素数量确定要绘制的媒体数量
  const mediaCount = fullLayoutSchema.elements.length

  // 绘制所有元素
  for (let i = 0; i < mediaCount; i++) {
    const element = fullLayoutSchema.elements[i]
    if (!(mediaItems[i] && mediaItems[i].src && element)) {
      // 绘制占位符
      ctx.save()
      drawPlaceholder(ctx, element, canvasWidth, canvasHeight)
      ctx.restore()
      continue
    }

    // 根据媒体类型创建相应的元素
    if (mediaItems[i].type === 'video') {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.loop = true
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'

      // 将视频元素与索引关联
      videoElementMap.set(`video-${i}`, video)

      const promise = new Promise<void>((resolve) => {
        video.onloadeddata = async () => {
          try {
            // 确保视频尺寸已设置
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              video.width = video.videoWidth
              video.height = video.videoHeight
            }

            // 尝试播放视频
            if (video.readyState >= 2) {
              try {
                // 在iOS上，可能需要用户交互才能播放视频
                await video.play()
              } catch (playError) {
                // eslint-disable-next-line no-console
                console.warn('Failed to play video (may be due to iOS restrictions):', playError)
              }

              resolve()
            } else {
              // 视频未准备好，绘制占位符
              ctx.save()
              drawPlaceholder(ctx, element, canvasWidth, canvasHeight)
              ctx.restore()
              resolve()
            }
          } catch (drawError) {
            // eslint-disable-next-line no-console
            console.warn('Failed to draw video:', drawError)
            // 绘制占位符
            ctx.save()
            drawPlaceholder(ctx, element, canvasWidth, canvasHeight)
            ctx.restore()
            resolve()
          }
        }

        video.onloadedmetadata = () => {
          // 确保视频尺寸已设置
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            video.width = video.videoWidth
            video.height = video.videoHeight
          }

          // 视频元数据加载完成
        }

        video.onerror = (e) => {
          // eslint-disable-next-line no-console
          console.error('Failed to load video:', e)
          // 绘制占位符
          ctx.save()
          drawPlaceholder(ctx, element, canvasWidth, canvasHeight)
          ctx.restore()
          resolve()
        }
      })

      video.src = mediaItems[i].src as string
      mediaPromises.push(promise)
    } else {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      const promise = new Promise<void>((resolve) => {
        img.onload = () => {
          // 保存上下文状态
          ctx.save()
          // 使用服务函数绘制图片，确保应用所有效果（遮罩、阴影等）
          drawMedia(ctx, img, element, canvasWidth, canvasHeight)
          // 恢复上下文状态
          ctx.restore()
          resolve()
        }
        img.onerror = (e) => {
          // eslint-disable-next-line no-console
          console.error('Failed to load image:', e)
          // 绘制占位符
          ctx.save()
          drawPlaceholder(ctx, element, canvasWidth, canvasHeight)
          ctx.restore()
          resolve()
        }
      })

      img.src = mediaItems[i].src as string
      mediaPromises.push(promise)
    }
  }

  // 等待所有媒体加载完成
  await Promise.all(mediaPromises)

  return videoElementMap
}

/**
 * 清理视频元素
 * @param videoElementMap 视频元素映射
 */
export function cleanupVideoElements(videoElementMap: Map<string, HTMLVideoElement>) {
  videoElementMap.forEach((video) => {
    if (video.parentNode) {
      video.parentNode.removeChild(video)
    }
  })
}
