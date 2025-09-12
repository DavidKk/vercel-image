import { drawMediaCover } from '@/app/mosaic/services/layout/rendering'
import type { ImageElement } from '@/app/mosaic/types'

// Mock Canvas API
class MockCanvasRenderingContext2D {
  drawImageCalls: any[] = []

  drawImage(...args: any[]) {
    this.drawImageCalls.push(args)
  }
}

describe('drawMediaCover', () => {
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

  it('should draw wide image with cover fit (height-based scaling)', () => {
    const element: ImageElement = {
      fit: 'cover',
    } as ImageElement

    const pos = {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    }

    drawMediaCover(ctx, img, element, pos)

    // For a 100x50 image in a 50x50 area:
    // Target ratio: 1:1, Image ratio: 2:1
    // Image should be scaled to 100x50 to fill height
    // Then cropped horizontally by 25px on each side
    expect(ctx.drawImageCalls.length).toBe(1)
    const call = ctx.drawImageCalls[0]
    expect(call[0]).toBe(img) // Source image
    expect(call[1]).toBe(25) // sourceX (crop 25px from left)
    expect(call[2]).toBe(0) // sourceY (no vertical crop)
    expect(call[3]).toBe(50) // sourceWidth (50px width after cropping)
    expect(call[4]).toBe(50) // sourceHeight (full height)
    expect(call[5]).toBe(0) // destX
    expect(call[6]).toBe(0) // destY
    expect(call[7]).toBe(50) // destWidth
    expect(call[8]).toBe(50) // destHeight
  })

  it('should draw tall image with cover fit (width-based scaling)', () => {
    // Create a tall image using native Image element
    img = new window.Image()
    img.width = 50
    img.height = 100

    const element: ImageElement = {
      fit: 'cover',
    } as ImageElement

    const pos = {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    }

    drawMediaCover(ctx, img, element, pos)

    // For a 50x100 image in a 50x50 area:
    // Target ratio: 1:1, Image ratio: 1:2
    // Image should be scaled to 50x100 to fill width
    // Then cropped vertically by 25px on each side
    expect(ctx.drawImageCalls.length).toBe(1)
    const call = ctx.drawImageCalls[0]
    expect(call[0]).toBe(img) // Source image
    expect(call[1]).toBe(0) // sourceX (no horizontal crop)
    expect(call[2]).toBe(25) // sourceY (crop 25px from top)
    expect(call[3]).toBe(50) // sourceWidth (full width)
    expect(call[4]).toBe(50) // sourceHeight (50px height after cropping)
    expect(call[5]).toBe(0) // destX
    expect(call[6]).toBe(0) // destY
    expect(call[7]).toBe(50) // destWidth
    expect(call[8]).toBe(50) // destHeight
  })
})
