import { useCallback } from 'react'
import { cloneSchema } from '@/app/mosaic/services/layout'
import { downloadCanvasAsVideo } from '@/app/mosaic/services/video/exporter'
import { initOffscreenCanvas, renderOffscreenContent, cleanupVideoElements } from '@/app/mosaic/services/video/renderer'
import type { LayoutSchema, MediaObject } from '@/app/mosaic/types'

/**
 * 视频导出 Hook
 */
export function useVideoExporter() {
  /**
   * 导出为视频
   * @param schema 布局配置
   * @param mediaItems 媒体项数组
   * @param duration 视频时长（秒）
   * @param onProgress 进度回调函数
   * @returns Promise
   */
  const exportAsVideo = useCallback(async (schema: LayoutSchema, mediaItems: MediaObject[], duration: number, onProgress?: (progress: number) => void) => {
    // 设置画布尺寸 - 使用更高的分辨率以提高视频质量
    const canvasWidth = 2560
    const canvasHeight = 1440

    // 获取当前布局配置
    const fullLayoutSchema = cloneSchema(schema)
    fullLayoutSchema.canvasWidth = canvasWidth
    fullLayoutSchema.canvasHeight = canvasHeight

    // 初始化离屏 Canvas
    const { canvas, ctx } = initOffscreenCanvas(canvasWidth, canvasHeight)

    // 创建视频元素映射
    let videoElementMap: Map<string, HTMLVideoElement> | null = null

    try {
      // 在离屏 Canvas 上渲染内容
      videoElementMap = await renderOffscreenContent(ctx, fullLayoutSchema, mediaItems, canvasWidth, canvasHeight)

      // 将视频元素添加到 body 中（在实际导出前），但隐藏它们
      videoElementMap.forEach((video) => {
        video.style.position = 'absolute'
        video.style.left = '-9999px'
        video.style.top = '-9999px'
        video.style.opacity = '0'
        video.style.pointerEvents = 'none'
        document.body.appendChild(video)
      })

      // 确保Canvas已完全绘制后再开始录制
      await new Promise((resolve) => requestAnimationFrame(resolve))

      // 延迟确保绘制完成并视频开始播放
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 下载为视频
      await downloadCanvasAsVideo(ctx, duration, fullLayoutSchema, mediaItems, canvasWidth, canvasHeight, videoElementMap, onProgress)
    } finally {
      // 清理视频元素
      if (videoElementMap) {
        cleanupVideoElements(videoElementMap)
      }
    }
  }, [])

  return {
    exportAsVideo,
  }
}
