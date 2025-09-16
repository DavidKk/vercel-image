import type { ImageElement, LayoutSchema } from '@/app/mosaic/types'
import { calculateElementPosition } from '../position'
import { drawMask, drawRoundedRectPath, drawShadow } from '../drawing'
import { convertPercentageToPixel } from '../utils'
import { drawMediaCover } from './drawMediaCover'
import { drawMediaContain } from './drawMediaContain'
import { drawMediaFill } from './drawMediaFill'

/**
 * 绘制媒体元素
 * 注意：此函数会在需要时调用 save() 和 restore() 来管理上下文状态
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

  // 根据fit属性绘制媒体
  switch (element.fit) {
    case 'cover':
      // 应用遮罩
      ctx.save()
      drawMask(ctx, element, pos.x, pos.y, pos.width, pos.height)

      if (element.borderRadius) {
        drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
        ctx.clip()
      }

      drawMediaCover(ctx, media, element, pos)
      ctx.restore()
      break

    case 'contain':
      // 应用遮罩
      ctx.save()
      drawMask(ctx, element, pos.x, pos.y, pos.width, pos.height)

      if (element.borderRadius) {
        drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
        ctx.clip()
      }

      drawMediaContain(ctx, media, element, pos)
      ctx.restore()
      break

    case 'fill':
    default:
      // 应用遮罩
      ctx.save()
      drawMask(ctx, element, pos.x, pos.y, pos.width, pos.height)

      if (element.borderRadius) {
        drawRoundedRectPath(ctx, pos.x, pos.y, pos.width, pos.height, element.borderRadius)
        ctx.clip()
      }

      drawMediaFill(ctx, media, element, pos)
      ctx.restore()
      break
  }
}
