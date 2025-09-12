import { drawMask } from '@/app/mosaic/services/layout/drawing'
import type { ImageElement } from '@/app/mosaic/types'

describe('drawMask', () => {
  let ctx: CanvasRenderingContext2D
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // 使用 jsdom 环境提供的原生 canvas
    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    ctx = canvas.getContext('2d')!
  })

  it('should not draw mask when element has no mask', () => {
    const element: ImageElement = {
      fit: 'cover',
    } as ImageElement

    // 保存原始的 clip 方法
    const originalClip = ctx.clip
    let clipCalled = false

    // 模拟 clip 方法以验证是否被调用
    ctx.clip = jest.fn().mockImplementation(() => {
      clipCalled = true
    })

    drawMask(ctx, element, 10, 10, 100, 50)

    expect(clipCalled).toBe(false)

    // 恢复原始方法
    ctx.clip = originalClip
  })

  it('should not draw mask when mask type is not shape', () => {
    const element: ImageElement = {
      fit: 'cover',
      mask: {
        type: 'image',
      },
    } as ImageElement

    // 保存原始的 clip 方法
    const originalClip = ctx.clip
    let clipCalled = false

    // 模拟 clip 方法以验证是否被调用
    ctx.clip = jest.fn().mockImplementation(() => {
      clipCalled = true
    })

    drawMask(ctx, element, 10, 10, 100, 50)

    expect(clipCalled).toBe(false)

    // 恢复原始方法
    ctx.clip = originalClip
  })

  it('should call drawShapeMask when mask type is shape', () => {
    const element: ImageElement = {
      fit: 'cover',
      mask: {
        type: 'shape',
        shape: 'circle',
      },
    } as ImageElement

    // 保存原始的 clip 方法
    const originalClip = ctx.clip
    let clipCalled = false

    // 模拟 clip 方法以验证是否被调用
    ctx.clip = jest.fn().mockImplementation(() => {
      clipCalled = true
    })

    drawMask(ctx, element, 10, 10, 100, 50)

    expect(clipCalled).toBe(true)

    // 恢复原始方法
    ctx.clip = originalClip
  })
})
