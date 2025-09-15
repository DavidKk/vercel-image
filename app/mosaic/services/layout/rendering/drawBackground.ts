import type { LayoutSchema } from '@/app/mosaic/types'

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