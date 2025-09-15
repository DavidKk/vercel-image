import { drawPlaceholder } from '@/app/mosaic/services/layout/rendering/drawPlaceholder'
import type { ImageElement } from '@/app/mosaic/types'

describe('Transform Tests', () => {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    // 创建真实的 Canvas 元素
    canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    ctx = canvas.getContext('2d')!
  })

  test('drawPlaceholder should apply rotation transform with default center origin', () => {
    const element: ImageElement = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 45,
      fit: 'cover',
    }

    // 保存当前状态
    ctx.save()
    const initialState = ctx.getTransform().toString()

    drawPlaceholder(ctx, element, 200, 200)

    // 恢复状态
    ctx.restore()
    const finalState = ctx.getTransform().toString()

    // 检查变换是否被正确应用和恢复
    expect(initialState).toBe(finalState)
  })

  test('drawPlaceholder should apply rotation transform with custom origin', () => {
    const element: ImageElement = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 45,
      origin: { x: '0%', y: '0%' }, // 左上角
      fit: 'cover',
    }

    // 保存当前状态
    ctx.save()
    const initialState = ctx.getTransform().toString()

    drawPlaceholder(ctx, element, 200, 200)

    // 恢复状态
    ctx.restore()
    const finalState = ctx.getTransform().toString()

    // 检查变换是否被正确应用和恢复
    expect(initialState).toBe(finalState)
  })

  test('drawPlaceholder should apply scale transform with custom origin', () => {
    const element: ImageElement = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      scaleX: 2,
      scaleY: 2,
      origin: { x: '50%', y: '50%' }, // 中心点
      fit: 'cover',
    }

    // 保存当前状态
    ctx.save()
    const initialState = ctx.getTransform().toString()

    drawPlaceholder(ctx, element, 200, 200)

    // 恢复状态
    ctx.restore()
    const finalState = ctx.getTransform().toString()

    // 检查变换是否被正确应用和恢复
    expect(initialState).toBe(finalState)
  })

  test('drawPlaceholder should apply both rotation and scale transforms', () => {
    const element: ImageElement = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 90,
      scaleX: 1.5,
      scaleY: 1.5,
      origin: { x: '100%', y: '100%' }, // 右下角
      fit: 'cover',
    }

    // 保存当前状态
    ctx.save()
    const initialState = ctx.getTransform().toString()

    drawPlaceholder(ctx, element, 200, 200)

    // 恢复状态
    ctx.restore()
    const finalState = ctx.getTransform().toString()

    // 检查变换是否被正确应用和恢复
    expect(initialState).toBe(finalState)
  })

  test('drawPlaceholder should not apply transforms when none are specified', () => {
    const element: ImageElement = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fit: 'cover',
    }

    // 保存当前状态
    ctx.save()
    const initialState = ctx.getTransform().toString()

    drawPlaceholder(ctx, element, 200, 200)

    // 恢复状态
    ctx.restore()
    const finalState = ctx.getTransform().toString()

    // 检查变换是否被正确应用和恢复
    expect(initialState).toBe(finalState)
  })
})
