import type { ImageElement } from '@/app/mosaic/types'

/**
 * 绘制 contain 模式的媒体
 * 等比缩放完整显示，留空区域
 * @param ctx Canvas绘制上下文
 * @param media 媒体元素（图片或视频）
 * @param element 图片元素配置
 * @param pos 元素位置信息
 */
export function drawMediaContain(
  ctx: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  element: ImageElement,
  pos: { x: number; y: number; width: number; height: number }
) {
  const containRatio = Math.min(pos.width / media.width, pos.height / media.height)
  const containWidth = media.width * containRatio
  const containHeight = media.height * containRatio
  const containX = pos.x + (pos.width - containWidth) / 2
  const containY = pos.y + (pos.height - containHeight) / 2

  ctx.drawImage(media, containX, containY, containWidth, containHeight)
}
