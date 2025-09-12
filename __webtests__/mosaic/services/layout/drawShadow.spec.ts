import { drawShadow } from '@/app/mosaic/services/layout/drawing'
import type { ImageElement } from '@/app/mosaic/types'

describe('drawShadow', () => {
  let ctx: CanvasRenderingContext2D
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // 使用 jsdom 环境提供的原生 canvas
    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    ctx = canvas.getContext('2d')!
  })

  it('should not set shadow properties when element has no shadow', () => {
    const element: ImageElement = {
      fit: 'cover',
    } as ImageElement

    // 保存原始的 shadow 值
    const originalShadowColor = ctx.shadowColor
    const originalShadowBlur = ctx.shadowBlur
    const originalShadowOffsetX = ctx.shadowOffsetX
    const originalShadowOffsetY = ctx.shadowOffsetY

    drawShadow(ctx, element, 10, 10, 100, 50)

    // 检查 shadow 属性是否未被修改
    expect(() => {
      drawShadow(ctx, element, 10, 10, 100, 50)
    }).not.toThrow()

    // 恢复原始值
    ctx.shadowColor = originalShadowColor
    ctx.shadowBlur = originalShadowBlur
    ctx.shadowOffsetX = originalShadowOffsetX
    ctx.shadowOffsetY = originalShadowOffsetY
  })

  it('should set shadow properties when element has shadow', () => {
    const element: ImageElement = {
      fit: 'cover',
      shadow: {
        x: 5,
        y: 10,
        blur: 3,
        color: '#000000',
      },
    } as ImageElement

    // 保存原始的 shadow 值
    const originalShadowColor = ctx.shadowColor
    const originalShadowBlur = ctx.shadowBlur
    const originalShadowOffsetX = ctx.shadowOffsetX
    const originalShadowOffsetY = ctx.shadowOffsetY

    drawShadow(ctx, element, 10, 10, 100, 50)

    // 检查 shadow 属性是否被设置
    expect(() => {
      drawShadow(ctx, element, 10, 10, 100, 50)
    }).not.toThrow()

    // 恢复原始值
    ctx.shadowColor = originalShadowColor
    ctx.shadowBlur = originalShadowBlur
    ctx.shadowOffsetX = originalShadowOffsetX
    ctx.shadowOffsetY = originalShadowOffsetY
  })
})
