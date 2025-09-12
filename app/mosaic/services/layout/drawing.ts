import type { ImageElement, Mask } from '@/app/mosaic/types'
import { convertPercentageToPixel } from './utils'

/**
 * 绘制圆角矩形路径
 * @param ctx Canvas绘制上下文
 * @param x X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param height 高度
 * @param borderRadius 圆角半径
 */
export function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, borderRadius: number) {
  ctx.beginPath()
  ctx.moveTo(x + borderRadius, y)
  ctx.lineTo(x + width - borderRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius)
  ctx.lineTo(x + width, y + height - borderRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height)
  ctx.lineTo(x + borderRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius)
  ctx.lineTo(x, y + borderRadius)
  ctx.quadraticCurveTo(x, y, x + borderRadius, y)
  ctx.closePath()
}

/**
 * 绘制形状遮罩
 * @param ctx Canvas绘制上下文
 * @param mask 遮罩配置
 * @param x X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param height 高度
 */
export function drawShapeMask(ctx: CanvasRenderingContext2D, mask: Mask, x: number, y: number, width: number, height: number) {
  switch (mask.shape) {
    case 'circle': {
      ctx.beginPath()
      ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
      ctx.clip()
      break
    }

    case 'rect': {
      // 矩形是默认形状，不需要特殊处理
      break
    }

    case 'polygon': {
      if (mask.polygonPoints && mask.polygonPoints.length > 0) {
        ctx.beginPath()

        const firstPoint = mask.polygonPoints[0]
        ctx.moveTo(convertPercentageToPixel(firstPoint.x, width) + x, convertPercentageToPixel(firstPoint.y, height) + y)

        for (let i = 1; i < mask.polygonPoints.length; i++) {
          const point = mask.polygonPoints[i]
          ctx.lineTo(convertPercentageToPixel(point.x, width) + x, convertPercentageToPixel(point.y, height) + y)
        }

        ctx.closePath()
        ctx.clip()
      }

      break
    }
  }
}

/**
 * 绘制遮罩
 * @param ctx Canvas绘制上下文
 * @param element 图片元素
 * @param x X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param height 高度
 */
export function drawMask(ctx: CanvasRenderingContext2D, element: ImageElement, x: number, y: number, width: number, height: number) {
  if (!element.mask) {
    return
  }

  // 检查 mask.type 是否为 'shape'
  if (element.mask.type === 'shape') {
    drawShapeMask(ctx, element.mask, x, y, width, height)
  }
}

/**
 * 绘制阴影
 * 注意：此函数不调用 save/restore，调用方需要负责上下文状态管理
 * @param ctx Canvas绘制上下文
 * @param element 图片元素
 * @param x X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param height 高度
 */
export function drawShadow(ctx: CanvasRenderingContext2D, element: ImageElement, x: number, y: number, width: number, height: number) {
  if (!element.shadow) {
    return
  }

  // 注意：此函数不调用 save/restore，调用方需要负责上下文状态管理
  ctx.shadowColor = element.shadow.color
  ctx.shadowBlur = element.shadow.blur
  ctx.shadowOffsetX = element.shadow.x
  ctx.shadowOffsetY = element.shadow.y
}
