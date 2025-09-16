import type { ImageElement } from '@/app/mosaic/types'

/**
 * 绘制 fill 模式的媒体
 * 强制拉伸媒体以填满整个区域
 * @param ctx Canvas绘制上下文
 * @param media 媒体元素（图片或视频）
 * @param element 图片元素配置
 * @param pos 元素位置信息
 */
export function drawMediaFill(
  ctx: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  element: ImageElement,
  pos: { x: number; y: number; width: number; height: number }
) {
  ctx.drawImage(media, pos.x, pos.y, pos.width, pos.height)
}
