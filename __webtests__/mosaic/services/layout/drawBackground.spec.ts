import { drawBackground } from '@/app/mosaic/services/layout/rendering/drawBackground'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('drawBackground', () => {
  let ctx: CanvasRenderingContext2D
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // 使用 jsdom 环境提供的原生 canvas
    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    ctx = canvas.getContext('2d')!
  })

  it('should draw white background', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [],
    } as LayoutSchema

    drawBackground(ctx, schema)

    // 验证背景颜色是否设置正确
    expect(ctx.fillStyle).toBe('#ffffff')

    // 验证是否绘制了正确的矩形区域
    const imageData = ctx.getImageData(0, 0, 100, 100)
    // 检查是否有非透明像素
    let hasNonTransparentPixel = false
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3]
      if (alpha > 0) {
        hasNonTransparentPixel = true
        break
      }
    }
    expect(hasNonTransparentPixel).toBe(true)
  })

  it('should draw background with different dimensions', () => {
    const schema: LayoutSchema = {
      canvasWidth: 200,
      canvasHeight: 150,
      elements: [],
    } as LayoutSchema

    drawBackground(ctx, schema)

    // 验证背景颜色是否设置正确
    expect(ctx.fillStyle).toBe('#ffffff')

    // 验证是否绘制了正确的矩形区域
    const imageData = ctx.getImageData(0, 0, 200, 150)
    // 检查是否有非透明像素
    let hasNonTransparentPixel = false
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3]
      if (alpha > 0) {
        hasNonTransparentPixel = true
        break
      }
    }
    expect(hasNonTransparentPixel).toBe(true)
  })
})
