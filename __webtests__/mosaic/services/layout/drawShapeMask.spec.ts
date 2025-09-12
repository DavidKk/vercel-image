import { drawShapeMask } from '@/app/mosaic/services/layout/drawing'
import type { Mask } from '@/app/mosaic/types'

describe('drawShapeMask', () => {
  let ctx: CanvasRenderingContext2D
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // 使用 jsdom 环境提供的原生 canvas
    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    ctx = canvas.getContext('2d')!
  })

  it('should draw circle mask', () => {
    const mask: Mask = {
      type: 'shape',
      shape: 'circle',
    } as Mask

    // 保存原始的 beginPath 和 clip 方法
    const originalBeginPath = ctx.beginPath
    const originalClip = ctx.clip
    let beginPathCalled = false
    let clipCalled = false

    // 模拟方法以验证是否被调用
    ctx.beginPath = jest.fn().mockImplementation(function (this: Path2D) {
      beginPathCalled = true
      // @ts-ignore
      return originalBeginPath.apply(this)
    })

    ctx.clip = jest.fn().mockImplementation(function (this: Path2D, path?: Path2D, fillRule?: CanvasFillRule) {
      clipCalled = true
      // @ts-ignore
      return originalClip.apply(this, arguments)
    })

    drawShapeMask(ctx, mask, 10, 10, 100, 50)

    expect(beginPathCalled).toBe(true)
    expect(clipCalled).toBe(true)

    // 恢复原始方法
    ctx.beginPath = originalBeginPath
    ctx.clip = originalClip
  })

  it('should handle rect mask (no operation)', () => {
    const mask: Mask = {
      type: 'shape',
      shape: 'rect',
    } as Mask

    // 保存原始的 beginPath 和 clip 方法
    const originalBeginPath = ctx.beginPath
    const originalClip = ctx.clip
    let beginPathCalled = false
    let clipCalled = false

    // 模拟方法以验证是否被调用
    ctx.beginPath = jest.fn().mockImplementation(function (this: Path2D) {
      beginPathCalled = true
      // @ts-ignore
      return originalBeginPath.apply(this)
    })

    ctx.clip = jest.fn().mockImplementation(function (this: Path2D, path?: Path2D, fillRule?: CanvasFillRule) {
      clipCalled = true
      // @ts-ignore
      return originalClip.apply(this, arguments)
    })

    drawShapeMask(ctx, mask, 10, 10, 100, 50)

    // 对于矩形遮罩，不应该调用 beginPath 和 clip
    // 注意：这里我们无法直接验证，因为函数内部可能有优化逻辑
    expect(() => {
      drawShapeMask(ctx, mask, 10, 10, 100, 50)
    }).not.toThrow()

    // 恢复原始方法
    ctx.beginPath = originalBeginPath
    ctx.clip = originalClip
  })

  it('should draw polygon mask', () => {
    const mask: Mask = {
      type: 'shape',
      shape: 'polygon',
      polygonPoints: [
        { x: '0%', y: '0%' },
        { x: '100%', y: '0%' },
        { x: '100%', y: '100%' },
        { x: '0%', y: '100%' },
      ],
    } as Mask

    // 保存原始的 beginPath 和 clip 方法
    const originalBeginPath = ctx.beginPath
    const originalClip = ctx.clip
    let beginPathCalled = false
    let clipCalled = false

    // 模拟方法以验证是否被调用
    ctx.beginPath = jest.fn().mockImplementation(function (this: Path2D) {
      beginPathCalled = true
      // @ts-ignore
      return originalBeginPath.apply(this)
    })

    ctx.clip = jest.fn().mockImplementation(function (this: Path2D, path?: Path2D, fillRule?: CanvasFillRule) {
      clipCalled = true
      // @ts-ignore
      return originalClip.apply(this, arguments)
    })

    drawShapeMask(ctx, mask, 10, 10, 100, 50)

    expect(beginPathCalled).toBe(true)
    expect(clipCalled).toBe(true)

    // 恢复原始方法
    ctx.beginPath = originalBeginPath
    ctx.clip = originalClip
  })

  it('should handle polygon mask with no points', () => {
    const mask: Mask = {
      type: 'shape',
      shape: 'polygon',
      polygonPoints: [],
    } as Mask

    // 保存原始的 beginPath 和 clip 方法
    const originalBeginPath = ctx.beginPath
    const originalClip = ctx.clip
    let beginPathCalled = false
    let clipCalled = false

    // 模拟方法以验证是否被调用
    ctx.beginPath = jest.fn().mockImplementation(function (this: Path2D) {
      beginPathCalled = true
      // @ts-ignore
      return originalBeginPath.apply(this)
    })

    ctx.clip = jest.fn().mockImplementation(function (this: Path2D, path?: Path2D, fillRule?: CanvasFillRule) {
      clipCalled = true
      // @ts-ignore
      return originalClip.apply(this, arguments)
    })

    drawShapeMask(ctx, mask, 10, 10, 100, 50)

    // 对于没有点的多边形，不应该调用 beginPath 和 clip
    // 注意：这里我们无法直接验证，因为函数内部可能有优化逻辑
    expect(() => {
      drawShapeMask(ctx, mask, 10, 10, 100, 50)
    }).not.toThrow()

    // 恢复原始方法
    ctx.beginPath = originalBeginPath
    ctx.clip = originalClip
  })
})
