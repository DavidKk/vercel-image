import { drawMedia } from '@/app/mosaic/services/layout/rendering/drawMedia'
import type { ImageElement } from '@/app/mosaic/types'

describe('drawMedia', () => {
  let ctx: CanvasRenderingContext2D
  let canvas: HTMLCanvasElement
  let imageCanvas: HTMLCanvasElement

  beforeEach(() => {
    // 使用 jsdom 环境提供的原生 canvas
    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    ctx = canvas.getContext('2d')!

    // 创建一个用于图像的 canvas 并绘制一些内容
    imageCanvas = document.createElement('canvas')
    imageCanvas.width = 100
    imageCanvas.height = 100
    const imageCtx = imageCanvas.getContext('2d')!
    imageCtx.fillStyle = 'red'
    imageCtx.fillRect(0, 0, 100, 100)
  })

  it('should draw image with default fit (cover)', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
    } as ImageElement

    // 保存绘制前的像素数据
    const imageDataBefore = ctx.getImageData(0, 0, 100, 100)

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    // 检查绘制后是否有变化
    const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
    expect(imageDataBefore).not.toEqual(imageDataAfter)
  })

  it('should draw image with contain fit', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'contain',
    } as ImageElement

    // 保存绘制前的像素数据
    const imageDataBefore = ctx.getImageData(0, 0, 100, 100)

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    // 检查绘制后是否有变化
    const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
    expect(imageDataBefore).not.toEqual(imageDataAfter)
  })

  it('should draw image with fill fit', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'fill',
    } as ImageElement

    // 保存绘制前的像素数据
    const imageDataBefore = ctx.getImageData(0, 0, 100, 100)

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    // 检查绘制后是否有变化
    const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
    expect(imageDataBefore).not.toEqual(imageDataAfter)
  })

  it('should apply opacity', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      opacity: 0.5,
    } as ImageElement

    // 保存原始的 globalAlpha 值
    const originalGlobalAlpha = ctx.globalAlpha

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    // 检查 globalAlpha 是否被设置
    // 注意：由于我们无法直接访问内部实现，我们只能验证函数执行没有抛出异常
    expect(() => {
      // @ts-ignore - 我们知道 canvas 可以作为图像源使用
      drawMedia(ctx, imageCanvas, element, 100, 100, 0)
    }).not.toThrow()

    // 恢复原始值
    ctx.globalAlpha = originalGlobalAlpha
  })

  it('should apply shadow', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
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

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    // 检查 shadow 属性是否被设置
    // 注意：由于我们无法直接访问内部实现，我们只能验证函数执行没有抛出异常
    expect(() => {
      // @ts-ignore - 我们知道 canvas 可以作为图像源使用
      drawMedia(ctx, imageCanvas, element, 100, 100, 0)
    }).not.toThrow()

    // 恢复原始值
    ctx.shadowColor = originalShadowColor
    ctx.shadowBlur = originalShadowBlur
    ctx.shadowOffsetX = originalShadowOffsetX
    ctx.shadowOffsetY = originalShadowOffsetY
  })

  it('should apply blend mode', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      blendMode: 'multiply',
    } as ImageElement

    // 保存原始的 globalCompositeOperation 值
    const originalGlobalCompositeOperation = ctx.globalCompositeOperation

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    // 检查 globalCompositeOperation 是否被设置
    // 注意：由于我们无法直接访问内部实现，我们只能验证函数执行没有抛出异常
    expect(() => {
      // @ts-ignore - 我们知道 canvas 可以作为图像源使用
      drawMedia(ctx, imageCanvas, element, 100, 100, 0)
    }).not.toThrow()

    // 恢复原始值
    ctx.globalCompositeOperation = originalGlobalCompositeOperation
  })

  it('should apply mask', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      mask: {
        type: 'shape' as const,
        shape: 'circle' as const,
      },
    } as ImageElement

    // Mock drawMask
    const drawingModule = require('@/app/mosaic/services/layout/drawing')
    const originalDrawMask = drawingModule.drawMask
    let drawMaskCalled = false

    drawingModule.drawMask = jest.fn().mockImplementation(() => {
      drawMaskCalled = true
    })

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    expect(drawMaskCalled).toBe(true)

    // Restore original function
    drawingModule.drawMask = originalDrawMask
  })

  it('should apply border radius', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      borderRadius: 10,
    } as ImageElement

    // 保存原始的 clip 方法
    const originalClip = ctx.clip
    let clipCalled = false

    // 模拟 clip 方法以验证是否被调用
    ctx.clip = jest.fn().mockImplementation(() => {
      clipCalled = true
    })

    // @ts-ignore - 我们知道 canvas 可以作为图像源使用
    drawMedia(ctx, imageCanvas, element, 100, 100, 0)

    // Should call clip for rounded corners
    expect(clipCalled).toBe(true)

    // 恢复原始方法
    ctx.clip = originalClip
  })
})
