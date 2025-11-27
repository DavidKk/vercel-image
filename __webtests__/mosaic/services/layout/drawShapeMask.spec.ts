import { expect, test } from '@playwright/test'

/**
 * 将 Jest 测试迁移到 Playwright
 * 测试 drawShapeMask 函数
 */
test.describe('drawShapeMask', () => {
  test('should draw circle mask', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawShapeMask } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const mask = {
        type: 'shape',
        shape: 'circle',
      }

      // 保存原始的 beginPath 和 clip 方法
      const originalBeginPath = ctx.beginPath.bind(ctx)
      const originalClip = ctx.clip.bind(ctx)
      let beginPathCalled = false
      let clipCalled = false

      // 模拟方法以验证是否被调用
      ctx.beginPath = function (this: CanvasRenderingContext2D) {
        beginPathCalled = true
        return originalBeginPath.call(this)
      }

      ctx.clip = function (this: CanvasRenderingContext2D) {
        clipCalled = true
        return originalClip.call(this)
      }

      drawShapeMask(ctx, mask, 10, 10, 100, 50)

      // 恢复原始方法
      ctx.beginPath = originalBeginPath
      ctx.clip = originalClip

      return {
        beginPathCalled,
        clipCalled,
      }
    })

    expect(result.beginPathCalled).toBe(true)
    expect(result.clipCalled).toBe(true)
  })

  test('should handle rect mask (no operation)', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawShapeMask } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const mask = {
        type: 'shape',
        shape: 'rect',
      }

      let error = null
      try {
        drawShapeMask(ctx, mask, 10, 10, 100, 50)
      } catch (e: any) {
        error = e.message
      }

      return {
        noError: error === null,
      }
    })

    expect(result.noError).toBe(true)
  })

  test('should draw polygon mask', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawShapeMask } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const mask = {
        type: 'shape',
        shape: 'polygon',
        polygonPoints: [
          { x: '0%', y: '0%' },
          { x: '100%', y: '0%' },
          { x: '100%', y: '100%' },
          { x: '0%', y: '100%' },
        ],
      }

      // 保存原始的 beginPath 和 clip 方法
      const originalBeginPath = ctx.beginPath.bind(ctx)
      const originalClip = ctx.clip.bind(ctx)
      let beginPathCalled = false
      let clipCalled = false

      // 模拟方法以验证是否被调用
      ctx.beginPath = function (this: CanvasRenderingContext2D) {
        beginPathCalled = true
        return originalBeginPath.call(this)
      }

      ctx.clip = function (this: CanvasRenderingContext2D) {
        clipCalled = true
        return originalClip.call(this)
      }

      drawShapeMask(ctx, mask, 10, 10, 100, 50)

      // 恢复原始方法
      ctx.beginPath = originalBeginPath
      ctx.clip = originalClip

      return {
        beginPathCalled,
        clipCalled,
      }
    })

    expect(result.beginPathCalled).toBe(true)
    expect(result.clipCalled).toBe(true)
  })

  test('should handle polygon mask with no points', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawShapeMask } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const mask = {
        type: 'shape',
        shape: 'polygon',
        polygonPoints: [],
      }

      let error = null
      try {
        drawShapeMask(ctx, mask, 10, 10, 100, 50)
      } catch (e: any) {
        error = e.message
      }

      return {
        noError: error === null,
      }
    })

    expect(result.noError).toBe(true)
  })
})
