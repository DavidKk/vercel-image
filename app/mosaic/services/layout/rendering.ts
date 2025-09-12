import type { ImageElement, LayoutSchema } from '@/app/mosaic/types'
import { calculateElementPosition } from './position'
import { drawMask, drawRoundedRectPath, drawShadow } from './drawing'
import { convertPercentageToPixel } from './utils'

/**
 * 绘制占位符
 * 注意：此函数不调用 save/restore，调用方需要负责上下文状态管理
 * @param ctx Canvas绘制上下文
 * @param element 图片元素
 * @param canvasWidth 画布宽度
 * @param canvasHeight 画布高度
 * @param padding 内容与画布边缘的距离（百分比值，0-10%）
 */
export function drawPlaceholder(ctx: CanvasRenderingContext2D, element: ImageElement, canvasWidth: number, canvasHeight: number, padding = 0) {
  const pos = calculateElementPosition(element, canvasWidth, canvasHeight, padding)
  // 注意：此函数不调用 save/restore，调用方需要负责上下文状态管理

  // 应用变换
  if (element.rotation || element.scaleX !== undefined || element.scaleY !== undefined) {
    // 计算变换中心点
    let originX = pos.x + pos.width / 2
    let originY = pos.y + pos.height / 2

    if (element.origin) {
      originX = pos.x + convertPercentageToPixel(element.origin.x, pos.width)
      originY = pos.y + convertPercentageToPixel(element.origin.y, pos.height)
    }

    ctx.translate(originX, originY)

    // 应用旋转
    if (element.rotation) {
      ctx.rotate((element.rotation * Math.PI) / 180)
    }

    // 应用缩放
    if (element.scaleX !== undefined || element.scaleY !== undefined) {
      ctx.scale(element.scaleX || 1, element.scaleY || 1)
    }

    ctx.translate(-originX, -originY)
  }

  // 应用遮罩
  drawMask(ctx, element, pos.x, pos.y, pos.width, pos.height)

  // 绘制背景色
  if (element.backgroundColor) {
    ctx.fillStyle = element.backgroundColor
    if (element.borderRadius) {
      drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
      ctx.fill()
    } else {
      ctx.fillRect(pos.x, pos.y, pos.width, pos.height)
    }
  } else {
    // 默认使用浅灰色背景
    ctx.fillStyle = '#f3f4f6'
    if (element.borderRadius) {
      drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
      ctx.fill()
    } else {
      ctx.fillRect(pos.x, pos.y, pos.width, pos.height)
    }
  }
}

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

/**
 * 绘制媒体元素
 * 注意：此函数不调用 save/restore，调用方需要负责上下文状态管理
 * @param ctx Canvas绘制上下文
 * @param media 媒体元素（图片或视频）
 * @param element 图片元素配置
 * @param canvasWidth 画布宽度
 * @param canvasHeight 画布高度
 * @param padding 内容与画布边缘的距离（百分比值，0-10%）
 */
export function drawMedia(
  ctx: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  element: ImageElement,
  canvasWidth: number,
  canvasHeight: number,
  padding = 0
) {
  const pos = calculateElementPosition(element, canvasWidth, canvasHeight, padding)
  // 注意：此函数不调用 save/restore，调用方需要负责上下文状态管理

  // 保存当前状态，以便在应用效果后恢复
  ctx.save()

  // 应用变换
  if (element.rotation || element.scaleX !== undefined || element.scaleY !== undefined) {
    // 计算变换中心点
    let originX = pos.x + pos.width / 2
    let originY = pos.y + pos.height / 2

    if (element.origin) {
      originX = pos.x + convertPercentageToPixel(element.origin.x, pos.width)
      originY = pos.y + convertPercentageToPixel(element.origin.y, pos.height)
    }

    ctx.translate(originX, originY)

    // 应用旋转
    if (element.rotation) {
      ctx.rotate((element.rotation * Math.PI) / 180)
    }

    // 应用缩放
    if (element.scaleX !== undefined || element.scaleY !== undefined) {
      ctx.scale(element.scaleX || 1, element.scaleY || 1)
    }

    ctx.translate(-originX, -originY)
  }

  // 应用透明度
  if (element.opacity !== undefined) {
    ctx.globalAlpha = element.opacity
  }

  // 应用阴影
  drawShadow(ctx, element, pos.x, pos.y, pos.width, pos.height)

  // 应用混合模式
  if (element.blendMode) {
    // 确保混合模式是有效的
    const validBlendModes: GlobalCompositeOperation[] = [
      'source-over',
      'source-in',
      'source-out',
      'source-atop',
      'destination-over',
      'destination-in',
      'destination-out',
      'destination-atop',
      'lighter',
      'copy',
      'xor',
      'multiply',
      'screen',
      'overlay',
      'darken',
      'lighten',
      'color-dodge',
      'color-burn',
      'hard-light',
      'soft-light',
      'difference',
      'exclusion',
      'hue',
      'saturation',
      'color',
      'luminosity',
    ]

    if (validBlendModes.includes(element.blendMode as GlobalCompositeOperation)) {
      ctx.globalCompositeOperation = element.blendMode as GlobalCompositeOperation
    }
  }

  // 恢复状态，确保阴影、混合模式等效果不会影响图片绘制
  ctx.restore()

  // 根据fit属性绘制媒体
  switch (element.fit) {
    case 'cover':
      // 应用遮罩
      if (element.mask) {
        ctx.save()
        drawMask(ctx, element, pos.x, pos.y, pos.width, pos.height)
      }

      if (element.borderRadius) {
        drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
        ctx.clip()
      }

      drawMediaCover(ctx, media, element, pos)

      if (element.mask) {
        ctx.restore()
      }
      break

    case 'contain':
      // 应用遮罩
      if (element.mask) {
        ctx.save()
        drawMask(ctx, element, pos.x, pos.y, pos.width, pos.height)
      }

      if (element.borderRadius) {
        drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
        ctx.clip()
      }

      drawMediaContain(ctx, media, element, pos)

      if (element.mask) {
        ctx.restore()
      }
      break

    case 'fill':
    default:
      // 应用遮罩
      if (element.mask) {
        ctx.save()
        drawMask(ctx, element, pos.x, pos.y, pos.width, pos.height)
      }

      if (element.borderRadius) {
        drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
        ctx.clip()
      }

      drawMediaFill(ctx, media, element, pos)

      if (element.mask) {
        ctx.restore()
      }
      break
  }
}

/**
 * 绘制背景
 * @param ctx Canvas绘制上下文
 * @param schema 布局配置
 */
export function drawBackground(ctx: CanvasRenderingContext2D, schema: LayoutSchema) {
  // 绘制背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, schema.canvasWidth, schema.canvasHeight)

  // 不需要特别处理padding区域的背景色，因为画布背景已经是白色
}
