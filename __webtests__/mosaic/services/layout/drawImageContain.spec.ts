import { drawMediaContain } from '@/app/mosaic/services/layout/rendering'
import type { ImageElement } from '@/app/mosaic/types'

// Mock Canvas API
class MockCanvasRenderingContext2D {
  drawImageCalls: any[] = []

  drawImage(...args: any[]) {
    this.drawImageCalls.push(args)
  }
}

describe('drawMediaContain', () => {
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

  it('should draw wide image with contain fit (height-based scaling)', () => {
    const element: ImageElement = {
      fit: 'contain',
    } as ImageElement

    const pos = {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    }

    drawMediaContain(ctx, img, element, pos)

    // For a 100x50 image in a 50x50 area:
    // Contain ratio: min(50/100, 50/50) = min(0.5, 1) = 0.5
    // Scaled size: 100*0.5 x 50*0.5 = 50x25
    // Positioned at: (0, 12.5) to center vertically
    expect(ctx.drawImageCalls.length).toBe(1)
    const call = ctx.drawImageCalls[0]
    expect(call[0]).toBe(img) // Source image
    expect(call[1]).toBe(0) // destX
    expect(call[2]).toBe(12.5) // destY (centered vertically)
    expect(call[3]).toBe(50) // destWidth
    expect(call[4]).toBe(25) // destHeight
  })

  it('should draw tall image with contain fit (width-based scaling)', () => {
    // Create a tall image using native Image element
    img = new window.Image()
    img.width = 50
    img.height = 100

    const element: ImageElement = {
      fit: 'contain',
    } as ImageElement

    const pos = {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    }

    drawMediaContain(ctx, img, element, pos)

    // For a 50x100 image in a 50x50 area:
    // Contain ratio: min(50/50, 50/100) = min(1, 0.5) = 0.5
    // Scaled size: 50*0.5 x 100*0.5 = 25x50
    // Positioned at: (12.5, 0) to center horizontally
    expect(ctx.drawImageCalls.length).toBe(1)
    const call = ctx.drawImageCalls[0]
    expect(call[0]).toBe(img) // Source image
    expect(call[1]).toBe(12.5) // destX (centered horizontally)
    expect(call[2]).toBe(0) // destY
    expect(call[3]).toBe(25) // destWidth
    expect(call[4]).toBe(50) // destHeight
  })
})
