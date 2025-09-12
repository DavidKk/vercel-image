import { drawRoundedRectPath } from '@/app/mosaic/services/layout/drawing'

describe('drawRoundedRectPath', () => {
  let ctx: CanvasRenderingContext2D
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // 使用 jsdom 环境提供的原生 canvas
    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    ctx = canvas.getContext('2d')!
  })

  it('should draw rounded rectangle path', () => {
    // 保存原始的方法
    const originalBeginPath = ctx.beginPath
    const originalMoveTo = ctx.moveTo
    const originalLineTo = ctx.lineTo
    const originalQuadraticCurveTo = ctx.quadraticCurveTo
    const originalClosePath = ctx.closePath

    let beginPathCalled = false
    let moveToCalled = false
    let lineToCalled = false
    let quadraticCurveToCalled = false
    let closePathCalled = false

    // 模拟方法以验证是否被调用
    ctx.beginPath = jest.fn().mockImplementation(() => {
      beginPathCalled = true
      return originalBeginPath.call(ctx)
    })

    ctx.moveTo = jest.fn().mockImplementation((x, y) => {
      moveToCalled = true
      return originalMoveTo.call(ctx, x, y)
    })

    ctx.lineTo = jest.fn().mockImplementation((x, y) => {
      lineToCalled = true
      return originalLineTo.call(ctx, x, y)
    })

    ctx.quadraticCurveTo = jest.fn().mockImplementation((cpx, cpy, x, y) => {
      quadraticCurveToCalled = true
      return originalQuadraticCurveTo.call(ctx, cpx, cpy, x, y)
    })

    ctx.closePath = jest.fn().mockImplementation(() => {
      closePathCalled = true
      return originalClosePath.call(ctx)
    })

    drawRoundedRectPath(ctx, 10, 10, 100, 50, 5)

    expect(beginPathCalled).toBe(true)
    expect(moveToCalled).toBe(true)
    expect(lineToCalled).toBe(true)
    expect(quadraticCurveToCalled).toBe(true)
    expect(closePathCalled).toBe(true)

    // 恢复原始方法
    ctx.beginPath = originalBeginPath
    ctx.moveTo = originalMoveTo
    ctx.lineTo = originalLineTo
    ctx.quadraticCurveTo = originalQuadraticCurveTo
    ctx.closePath = originalClosePath
  })

  it('should handle zero border radius', () => {
    // 保存原始的方法
    const originalBeginPath = ctx.beginPath
    const originalMoveTo = ctx.moveTo
    const originalLineTo = ctx.lineTo
    const originalQuadraticCurveTo = ctx.quadraticCurveTo
    const originalClosePath = ctx.closePath

    let beginPathCalled = false
    let moveToCalled = false
    let lineToCalled = false
    let quadraticCurveToCalled = false
    let closePathCalled = false

    // 模拟方法以验证是否被调用
    ctx.beginPath = jest.fn().mockImplementation(() => {
      beginPathCalled = true
      return originalBeginPath.call(ctx)
    })

    ctx.moveTo = jest.fn().mockImplementation((x, y) => {
      moveToCalled = true
      return originalMoveTo.call(ctx, x, y)
    })

    ctx.lineTo = jest.fn().mockImplementation((x, y) => {
      lineToCalled = true
      return originalLineTo.call(ctx, x, y)
    })

    ctx.quadraticCurveTo = jest.fn().mockImplementation((cpx, cpy, x, y) => {
      quadraticCurveToCalled = true
      return originalQuadraticCurveTo.call(ctx, cpx, cpy, x, y)
    })

    ctx.closePath = jest.fn().mockImplementation(() => {
      closePathCalled = true
      return originalClosePath.call(ctx)
    })

    drawRoundedRectPath(ctx, 0, 0, 50, 30, 0)

    expect(beginPathCalled).toBe(true)
    expect(moveToCalled).toBe(true)
    expect(lineToCalled).toBe(true)
    expect(quadraticCurveToCalled).toBe(true)
    expect(closePathCalled).toBe(true)

    // 恢复原始方法
    ctx.beginPath = originalBeginPath
    ctx.moveTo = originalMoveTo
    ctx.lineTo = originalLineTo
    ctx.quadraticCurveTo = originalQuadraticCurveTo
    ctx.closePath = originalClosePath
  })
})
