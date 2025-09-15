import { drawMediaFill } from '@/app/mosaic/services/layout/rendering/drawMediaFill'
import type { ImageElement } from '@/app/mosaic/types'

// Mock Canvas API
class MockCanvasRenderingContext2D {
  drawImageCalls: any[] = []

  drawImage(...args: any[]) {
    this.drawImageCalls.push(args)
  }
}

describe('drawMediaFill', () => {
  let ctx: any
  let img: any

  beforeEach(() => {
    ctx = new MockCanvasRenderingContext2D()
    // 使用 jsdom 环境提供的原生 HTMLImageElement
    img = new window.Image()
    img.width = 100
    img.height = 50
    global.CanvasRenderingContext2D = class {} as any
  })

  it('should draw image with fill fit (stretch to fill)', () => {
    const element: ImageElement = {
      fit: 'fill',
    } as ImageElement

    const pos = {
      x: 10,
      y: 20,
      width: 80,
      height: 60,
    }

    drawMediaFill(ctx, img, element, pos)

    // Should stretch image to fill the entire area
    expect(ctx.drawImageCalls.length).toBe(1)
    const call = ctx.drawImageCalls[0]
    expect(call[0]).toBe(img) // Source image
    expect(call[1]).toBe(10) // destX
    expect(call[2]).toBe(20) // destY
    expect(call[3]).toBe(80) // destWidth
    expect(call[4]).toBe(60) // destHeight
  })
})
