'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { drawBackground, drawMedia, adjustSchemaForSpacing, cloneSchema } from '@/app/mosaic/services/layout'
import { useVideoExporter } from '@/app/mosaic/hooks/useVideoExporter'
import { getLongestVideoDuration } from '@/app/mosaic/services/video/utils'
import type { LayoutSchema, MediaObject } from '@/app/mosaic/types'
import MediaGrid from './MediaGrid'

export interface MosaicProps {
  schema: LayoutSchema
}

export default function Mosaic(props: MosaicProps) {
  const { schema } = props
  const { elements: DEFAULT_LAYOUT_ELEMENTS } = schema

  const [mediaItems, setMediaItems] = useState<MediaObject[]>(Array(DEFAULT_LAYOUT_ELEMENTS.length).fill({ type: 'image', src: null }))
  const [spacing, setSpacing] = useState<number>(schema.spacing || 0)
  const [padding, setPadding] = useState<number>(schema.padding || 0)
  const [isExporting, setIsExporting] = useState(false) // 添加导出状态
  const [exportProgress, setExportProgress] = useState(0) // 添加导出进度
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 使用视频导出 Hook
  const { exportAsVideo } = useVideoExporter()

  // 根据间距值调整元素尺寸和位置
  const adjustedSchema = useMemo(() => {
    const adjusted = adjustSchemaForSpacing({ schema, spacing })
    if (adjusted) {
      adjusted.padding = padding
    }
    return adjusted
  }, [schema, spacing, padding])

  // 获取spacing的范围配置，如果没有配置则使用默认值
  const spacingRange = useMemo(() => {
    if (schema.spacingRange) {
      return schema.spacingRange
    }
    return [0, 10]
  }, [schema.spacingRange])

  // 获取padding的范围配置，如果没有配置则使用默认值
  const paddingRange = useMemo(() => {
    if (schema.paddingRange) {
      return schema.paddingRange
    }
    return [0, 10]
  }, [schema.paddingRange])

  // 检查媒体项中是否包含视频
  const hasVideo = useMemo(() => {
    return mediaItems.some((item) => item.type === 'video' && item.src)
  }, [mediaItems])

  const downloadCanvasAsImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a')
    link.download = `${new Date().getTime()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleMerge = useCallback(async () => {
    if (!canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // 设置画布尺寸 - 使用更高的分辨率以保持一致性，并根据 schema 的宽高比进行调整
    const canvasWidth = 2560
    const aspectRatio = schema.canvasHeight / schema.canvasWidth
    const canvasHeight = canvasWidth * aspectRatio
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // 获取当前布局配置
    const fullLayoutSchema = cloneSchema(adjustedSchema)
    fullLayoutSchema.canvasWidth = canvasWidth
    fullLayoutSchema.canvasHeight = canvasHeight

    // 绘制背景
    drawBackground(ctx, fullLayoutSchema)

    // 创建一个 Promise 数组来跟踪所有图片的加载
    const imagePromises: Promise<void>[] = []

    // 根据布局配置中的元素数量确定要绘制的图片数量
    const imageCount = fullLayoutSchema.elements.length

    // 绘制所有元素
    for (let i = 0; i < imageCount; i++) {
      const element = fullLayoutSchema.elements[i]
      if (!(mediaItems[i] && mediaItems[i].src && element)) {
        continue
      }

      // 根据媒体类型创建相应的元素
      if (mediaItems[i].type === 'video') {
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true

        const promise = new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            // 保存上下文状态
            ctx.save()
            // 使用服务函数绘制视频，确保应用所有效果（遮罩、阴影等）
            drawMedia(ctx, video, element, canvasWidth, canvasHeight, padding)
            // 恢复上下文状态
            ctx.restore()
            resolve()
          }
          video.onerror = reject
        })

        video.src = mediaItems[i].src as string
        imagePromises.push(promise)
      } else {
        const img = new Image()
        const promise = new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // 保存上下文状态
            ctx.save()
            // 使用服务函数绘制图片，确保应用所有效果（遮罩、阴影等）
            drawMedia(ctx, img, element, canvasWidth, canvasHeight, padding)
            // 恢复上下文状态
            ctx.restore()
            resolve()
          }
          img.onerror = reject
        })

        img.src = mediaItems[i].src as string
        imagePromises.push(promise)
      }
    }

    try {
      await Promise.all(imagePromises)
      downloadCanvasAsImage(canvas)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Image loading failed:', error)
      downloadCanvasAsImage(canvas)
    }
  }, [mediaItems, adjustedSchema, padding, schema.canvasHeight, schema.canvasWidth])

  // 添加一个处理视频下载的函数
  const handleMergeAsVideo = useCallback(
    async (duration = 15) => {
      try {
        // 设置导出状态
        setIsExporting(true)
        setExportProgress(0)

        // 使用 Hook 导出为视频
        await exportAsVideo(adjustedSchema, mediaItems, duration, (progress) => {
          setExportProgress(progress)
        })

        // 完成导出
        setIsExporting(false)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to export video', error)
        // 如果视频生成失败，回退到图片下载
        if (canvasRef.current) {
          downloadCanvasAsImage(canvasRef.current)
        }
        // 重置导出状态
        setIsExporting(false)
        setExportProgress(0)
      }
    },
    [adjustedSchema, mediaItems, exportAsVideo]
  )

  // 智能下载函数 - 根据媒体类型自动选择下载方式
  const handleSmartDownload = useCallback(async () => {
    // 如果包含视频，则下载为视频，否则下载为图片
    if (hasVideo) {
      // 获取最长视频的时长
      const videoUrls = mediaItems.filter((item) => item.type === 'video' && item.src).map((item) => item.src as string)
      const duration = await getLongestVideoDuration(videoUrls)
      handleMergeAsVideo(duration)
    } else {
      handleMerge()
    }
  }, [hasVideo, mediaItems, handleMerge, handleMergeAsVideo])

  // 重置所有媒体项
  const handleReset = () => {
    // 在重置前，我们需要释放所有通过 URL.createObjectURL 创建的对象 URL
    // 但我们无法直接访问 MediaGrid 中的对象 URL，所以我们需要在 MediaGrid 组件内部处理

    setMediaItems(Array(adjustedSchema.elements.length).fill({ type: 'image', src: null }))
  }

  return (
    <div className="container mx-auto w-full">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* 操作按钮 */}
          <button
            onClick={handleSmartDownload}
            disabled={mediaItems.every((item) => !item.src) || isExporting}
            className="relative max-w-lg bg-indigo-500 text-white px-4 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </div>
            ) : (
              'Download'
            )}
          </button>
          <button onClick={handleReset} className="relative max-w-lg bg-red-500 text-white px-4 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* 间距控制 */}
          {schema.spacingRange ? (
            <div className="flex items-center">
              <label htmlFor="spacing" className="mr-2 whitespace-nowrap">
                Spacing:
              </label>
              <input id="spacing" type="range" min={spacingRange[0]} max={spacingRange[1]} value={spacing} onChange={(e) => setSpacing(Number(e.target.value))} className="w-32" />
              <span className="ml-2 text-sm">{spacing}%</span>
            </div>
          ) : null}

          {/* 内边距控制 */}
          {schema.paddingRange ? (
            <div className="flex items-center">
              <label htmlFor="padding" className="mr-2 whitespace-nowrap">
                Padding:
              </label>
              <input id="padding" type="range" min={paddingRange[0]} max={paddingRange[1]} value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-32" />
              <span className="ml-2 text-sm">{padding}%</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 进度条 */}
      {isExporting && (
        <div className="mb-6 w-full">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 transition-all duration-300 ease-out" style={{ width: `${exportProgress}%` }}></div>
          </div>
          <div className="text-right text-sm text-gray-500 mt-1">{exportProgress}%</div>
        </div>
      )}

      {/* 隐藏的画布用于合成和下载 */}
      <canvas ref={canvasRef} className="hidden" width="1024" height="1024" />

      {/* 媒体网格 */}
      <MediaGrid schema={adjustedSchema} mediaItems={mediaItems} setMediaItems={setMediaItems} spacing={spacing} padding={padding} />
    </div>
  )
}
