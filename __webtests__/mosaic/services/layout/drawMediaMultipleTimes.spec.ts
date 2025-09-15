import { drawMedia } from '@/app/mosaic/services/layout/rendering/drawMedia'
import type { ImageElement } from '@/app/mosaic/types'

// Mock Canvas API
class MockCanvasRenderingContext2D {
  drawImageCalls: any[] = []
  saveCalls = 0
  restoreCalls = 0
  globalAlpha = 1
  globalCompositeOperation = 'source-over'

  drawImage(...args: any[]) {
    this.drawImageCalls.push(args)
  }

  save() {
    this.saveCalls++
  }

  restore() {
    this.restoreCalls++
  }
}

describe('drawMedia multiple times', () => {
  let ctx: any
  let img: any

  beforeEach(() => {
    ctx = new MockCanvasRenderingContext2D()
    // 使用 jsdom 环境提供的原生 HTMLImageElement
    img = new window.Image()
    img.width = 100
    img.height = 100
    global.CanvasRenderingContext2D = class {} as any
  })

  it('should be able to draw the same image multiple times', () => {
    const element: ImageElement = {
      fit: 'cover',
    } as ImageElement

    // First draw
    drawMedia(ctx, img, element, 200, 200, 0)

    // Second draw of the same image
    drawMedia(ctx, img, element, 200, 200, 0)

    // Should have drawn the image twice
    expect(ctx.drawImageCalls.length).toBe(2)

    // Both calls should use the same image
    expect(ctx.drawImageCalls[0][0]).toBe(img)
    expect(ctx.drawImageCalls[1][0]).toBe(img)
  })

  it('should properly save and restore context state for each draw', () => {
    const element: ImageElement = {
      fit: 'cover',
      opacity: 0.5,
      blendMode: 'multiply',
    } as ImageElement

    // Draw the same image twice
    drawMedia(ctx, img, element, 200, 200, 0)
    drawMedia(ctx, img, element, 200, 200, 0)

    // Should save and restore context for each draw
    // Each drawMedia call should save and restore once
    expect(ctx.saveCalls).toBe(2)
    expect(ctx.restoreCalls).toBe(2)
  })
})
