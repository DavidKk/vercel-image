import type { ImageElement } from '@/app/mosaic/types'

/**
 * 绘制 cover 模式的媒体
 * 保持媒体比例，裁剪多余部分，填满整个区域
 * @param ctx Canvas绘制上下文
 * @param media 媒体元素（图片或视频）
 * @param element 图片元素配置
 * @param pos 元素位置信息
 */
export function drawMediaCover(
  ctx: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  element: ImageElement,
  pos: { x: number; y: number; width: number; height: number }
) {
  const mediaRatio = media.width / media.height
  const targetRatio = pos.width / pos.height

  // 首先将媒体缩放到能够覆盖整个目标区域的尺寸
  let scaledWidth, scaledHeight
  if (mediaRatio > targetRatio) {
    // 媒体更宽，以目标高度为准进行缩放
    scaledHeight = pos.height
    scaledWidth = media.width * (pos.height / media.height)
  } else {
    // 媒体更高，以目标宽度为准进行缩放
    scaledWidth = pos.width
    scaledHeight = media.height * (pos.width / media.width)
  }

  // 计算裁剪区域的起始位置（相对于缩放后的媒体）
  const clipX = Math.max(0, (scaledWidth - pos.width) / 2)
  const clipY = Math.max(0, (scaledHeight - pos.height) / 2)

  // 计算裁剪区域在原始媒体中的对应位置和尺寸
  const sourceX = clipX * (media.width / scaledWidth)
  const sourceY = clipY * (media.height / scaledHeight)
  const sourceWidth = pos.width * (media.width / scaledWidth)
  const sourceHeight = pos.height * (media.height / scaledHeight)

  // 使用 drawImage 的九参数版本实现精确裁剪
  // 确保媒体正好填满目标区域，超出部分被裁剪
  ctx.drawImage(
    media,
    sourceX, // sourceX - 在原始媒体中的裁剪起始X坐标
    sourceY, // sourceY - 在原始媒体中的裁剪起始Y坐标
    sourceWidth, // sourceWidth - 在原始媒体中的裁剪宽度
    sourceHeight, // sourceHeight - 在原始媒体中的裁剪高度
    pos.x, // destX - 在画布上的目标X坐标
    pos.y, // destY - 在画布上的目标Y坐标
    pos.width, // destWidth - 在画布上的目标宽度
    pos.height // destHeight - 在画布上的目标高度
  )
}
