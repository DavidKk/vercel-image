import type { ImageElement } from '@/app/mosaic/types'

import { drawMask, drawRoundedRectPath } from '../drawing'
import { calculateElementPosition } from '../position'
import { convertPercentageToPixel } from '../utils'

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
