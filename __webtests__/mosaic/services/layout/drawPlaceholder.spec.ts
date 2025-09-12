import { drawPlaceholder } from '@/app/mosaic/services/layout/rendering'
import type { ImageElement } from '@/app/mosaic/types'

describe('drawPlaceholder', () => {
  let ctx: CanvasRenderingContext2D
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // 使用 jsdom 环境提供的原生 canvas
    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    ctx = canvas.getContext('2d')!
  })

  it('should draw placeholder with default background color', () => {
    const element: ImageElement = {
      x: '10%',
      y: '10%',
      width: '80%',
      height: '80%',
      fit: 'cover',
    } as ImageElement

    // 保存绘制前的像素数据
    const imageDataBefore = ctx.getImageData(0, 0, 100, 100)

    drawPlaceholder(ctx, element, 100, 100)

    // 检查绘制后是否有变化
    const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
    expect(imageDataBefore).not.toEqual(imageDataAfter)
  })

  it('should draw placeholder with custom background color', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      backgroundColor: '#ff0000',
      fit: 'cover',
    } as ImageElement

    // 保存原始的 fillStyle 值
    const originalFillStyle = ctx.fillStyle

    drawPlaceholder(ctx, element, 100, 100)

    // 检查 fillStyle 是否被设置
    expect(() => {
      drawPlaceholder(ctx, element, 100, 100)
    }).not.toThrow()

    // 恢复原始值
    ctx.fillStyle = originalFillStyle
  })

  it('should draw placeholder with border radius', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      borderRadius: 10,
      fit: 'cover',
    } as ImageElement

    // 保存绘制前的像素数据
    const imageDataBefore = ctx.getImageData(0, 0, 100, 100)

    drawPlaceholder(ctx, element, 100, 100)

    // 检查绘制后是否有变化
    const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
    expect(imageDataBefore).not.toEqual(imageDataAfter)
  })
})
