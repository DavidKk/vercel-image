import type { LayoutSchema, MediaObject } from '@/app/mosaic/types'
import { formatBytes } from '@/utils/size'

import { drawMedia } from '../layout'

/**
 * 验证Canvas内容是否有效
 * @param ctx Canvas渲染上下文
 * @returns 验证是否通过
 */
function validateCanvasContent(ctx: CanvasRenderingContext2D): { isValid: boolean; error?: string } {
  // 检查Canvas是否有内容
  if (ctx.canvas.width === 0 || ctx.canvas.height === 0) {
    const errorMsg = 'Canvas dimensions are invalid'
    return { isValid: false, error: errorMsg }
  }

  // 检查Canvas是否为空白
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const data = imageData.data

  // 检查是否有非空白像素
  let hasContent = false
  for (let i = 0; i < data.length; i += 4) {
    // 检查RGBA值是否都不为0
    if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0 || data[i + 3] !== 0) {
      hasContent = true
      break
    }
  }

  if (!hasContent) {
    const errorMsg = 'Canvas content is empty'
    return { isValid: false, error: errorMsg }
  }

  return { isValid: true }
}

/**
 * 创建离屏Canvas用于录制
 * @description 使用离屏Canvas的原因：
 * 1. 提高帧率：可以以更高的帧率进行录制（如60 FPS）
 * 2. 避免主线程阻塞：将绘制操作与主Canvas分离
 * 3. 确保一致性：确保录制的视频内容与主Canvas显示的内容保持一致
 * 4. 更好的控制：可以更好地控制录制过程中的绘制操作
 * @param ctx 原始Canvas上下文
 * @returns 离屏Canvas上下文或错误信息
 */
function createOffscreenCanvas(ctx: CanvasRenderingContext2D): { offscreenCtx?: CanvasRenderingContext2D; error?: string } {
  // 创建离屏Canvas用于录制
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = ctx.canvas.width
  offscreenCanvas.height = ctx.canvas.height
  const offscreenCtx = offscreenCanvas.getContext('2d')

  if (!offscreenCtx) {
    const errorMsg = 'Failed to create offscreen canvas context'
    return { error: errorMsg }
  }

  // 将原始Canvas内容复制到离屏Canvas
  offscreenCtx.drawImage(ctx.canvas, 0, 0)

  return { offscreenCtx }
}

/**
 * 获取浏览器支持的视频MIME类型
 * @returns 支持的MIME类型
 */
function getSupportedMimeType(): string {
  // 检查支持的MIME类型
  const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType
    }
  }

  return ''
}

/**
 * 创建媒体录制器并返回Promise
 * @param stream 媒体流
 * @param duration 录制时长
 * @param supportedMimeType 支持的MIME类型
 * @param onProgress 进度回调函数
 * @returns 包含录制Blob的Promise
 */
function createMediaRecorderPromise(stream: MediaStream, duration: number, supportedMimeType: string, onProgress?: (progress: number) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: supportedMimeType,
      videoBitsPerSecond: 10000000, // 设置视频比特率为10Mbps以进一步提高质量
    })

    const chunks: Blob[] = []
    let totalSize = 0

    // 收集录制数据
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
        totalSize += e.data.size
        // eslint-disable-next-line no-console
        console.log(`Received chunk, size: ${formatBytes(e.data.size)}, total size: ${formatBytes(totalSize)}`)

        // 更新进度（假设总时长为duration秒，每秒更新一次进度）
        const progress = Math.min(100, Math.floor((chunks.length / duration) * 100))
        onProgress?.(progress)
      }
    }

    // 录制完成后resolve Promise
    mediaRecorder.onstop = () => {
      // 完成进度
      onProgress?.(100)

      if (chunks.length === 0) {
        reject(new Error('No data recorded'))
        return
      }

      const blob = new Blob(chunks, { type: supportedMimeType })

      // 检查文件大小是否过小
      const fileSizeInMB = blob.size / (1024 * 1024)
      if (fileSizeInMB < 1) {
        reject(new Error(`Exported video file is less than 1MB, actual size: ${formatBytes(blob.size)}`))
        return
      }

      resolve(blob)
    }

    // 错误处理
    mediaRecorder.onerror = () => {
      reject(new Error('Media recorder error'))
    }

    // 开始录制
    mediaRecorder.start(1000) // 每秒收集一次数据块

    // 根据指定时长停止录制
    setTimeout(() => {
      mediaRecorder.stop()
    }, duration * 1000)
  })
}

/**
 * 启动Canvas动画更新循环
 * @param ctx Canvas上下文
 * @param fullLayoutSchema 布局配置
 * @param mediaItems 媒体项数组
 * @param canvasWidth Canvas宽度
 * @param canvasHeight Canvas高度
 * @param videoElementMap 视频元素映射
 * @param offscreenCtx 离屏Canvas上下文
 * @param duration 录制时长
 */
function startCanvasAnimationLoop(
  ctx: CanvasRenderingContext2D,
  fullLayoutSchema: LayoutSchema,
  mediaItems: MediaObject[],
  canvasWidth: number,
  canvasHeight: number,
  videoElementMap: Map<string, HTMLVideoElement>,
  offscreenCtx: CanvasRenderingContext2D,
  duration: number
) {
  // 在录制期间持续更新离屏Canvas内容
  let animationFrameId: number
  const startTime = Date.now()
  const endTime = startTime + duration * 1000

  // 保存必要的变量到闭包中
  const layoutSchema = fullLayoutSchema
  const items = mediaItems
  const width = canvasWidth
  const height = canvasHeight
  const videoMap = videoElementMap

  const updateCanvas = () => {
    const now = Date.now()
    if (now < endTime) {
      // 在每一帧都重新绘制视频内容到原始Canvas
      for (let i = 0; i < layoutSchema.elements.length; i++) {
        const element = layoutSchema.elements[i]
        if (!(items[i] && items[i].src && element)) {
          continue
        }

        if (items[i].type === 'video') {
          // 从映射中获取对应的视频元素
          const video = videoMap.get(`video-${i}`)
          if (video && video.readyState >= 2) {
            // 绘制当前视频帧到原始Canvas
            ctx.save()
            drawMedia(ctx, video, element, width, height)
            ctx.restore()
          }
        }
      }

      // 将更新后的原始Canvas内容复制到离屏Canvas
      // 这样可以确保录制的是最新内容，同时保持高帧率
      offscreenCtx.drawImage(ctx.canvas, 0, 0)
      animationFrameId = requestAnimationFrame(updateCanvas)
    }
  }

  // 开始更新Canvas
  updateCanvas()

  // 根据指定时长停止录制
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.log('Stopping recording...')
    // 取消动画帧
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  }, duration * 1000)
}

/**
 * 将Canvas内容转换为视频并下载
 * @param ctx Canvas渲染上下文
 * @param duration 视频时长（秒）
 * @param fullLayoutSchema 布局配置
 * @param mediaItems 媒体项数组
 * @param canvasWidth Canvas宽度
 * @param canvasHeight Canvas高度
 * @param videoElementMap 视频元素映射
 * @param onProgress 进度回调函数
 * @returns Promise，在视频下载完成后resolve
 */
export function downloadCanvasAsVideo(
  ctx: CanvasRenderingContext2D,
  duration: number,
  fullLayoutSchema: LayoutSchema,
  mediaItems: MediaObject[],
  canvasWidth: number,
  canvasHeight: number,
  videoElementMap: Map<string, HTMLVideoElement>,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 初始化进度
      onProgress?.(0)

      // 1. 验证Canvas内容
      const validation = validateCanvasContent(ctx)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // 2. 创建离屏Canvas
      const offscreenResult = createOffscreenCanvas(ctx)
      if (offscreenResult.error) {
        throw new Error(offscreenResult.error)
      }
      const { offscreenCtx } = offscreenResult

      // 3. 获取支持的MIME类型
      const supportedMimeType = getSupportedMimeType()
      if (!supportedMimeType) {
        throw new Error('Browser does not support any video format')
      }

      // 4. 使用离屏Canvas进行录制，提高帧率
      // 通过离屏Canvas可以实现更高的录制帧率（60 FPS），从而生成更流畅的视频
      const stream = offscreenCtx!.canvas.captureStream(60) // 60 FPS

      // 5. 检查是否有可用的视频轨道
      const videoTracks = stream.getVideoTracks()
      if (videoTracks.length === 0) {
        throw new Error('No available video tracks')
      }

      // 6. 启动Canvas动画更新循环
      startCanvasAnimationLoop(ctx, fullLayoutSchema, mediaItems, canvasWidth, canvasHeight, videoElementMap, offscreenCtx!, duration)

      // 7. 创建媒体录制器并等待录制完成
      const blob = await createMediaRecorderPromise(stream, duration, supportedMimeType, onProgress)

      // 8. 下载视频文件
      // 确定文件扩展名
      let extension = 'webm'
      if (supportedMimeType.includes('mp4')) {
        extension = 'mp4'
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mosaic-${new Date().getTime()}.${extension}`
      a.click()
      URL.revokeObjectURL(url)

      // 9. resolve Promise表示下载完成
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}
