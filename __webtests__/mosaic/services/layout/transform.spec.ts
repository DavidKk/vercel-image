import { expect, test } from '@playwright/test'

/**
 * 将 Jest 测试迁移到 Playwright
 * 测试 drawPlaceholder 函数的变换应用和恢复
 */
test.describe('Transform Tests', () => {
  test('drawPlaceholder should apply rotation transform with default center origin', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!

      const element = {
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

      return {
        initialState,
        finalState,
        transformRestored: initialState === finalState,
      }
    })

    expect(result.transformRestored).toBe(true)
  })

  test('drawPlaceholder should apply rotation transform with custom origin', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!

      const element = {
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

      return {
        transformRestored: initialState === finalState,
      }
    })

    expect(result.transformRestored).toBe(true)
  })

  test('drawPlaceholder should apply scale transform with custom origin', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!

      const element = {
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

      return {
        transformRestored: initialState === finalState,
      }
    })

    expect(result.transformRestored).toBe(true)
  })

  test('drawPlaceholder should apply both rotation and scale transforms', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!

      const element = {
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

      return {
        transformRestored: initialState === finalState,
      }
    })

    expect(result.transformRestored).toBe(true)
  })

  test('drawPlaceholder should not apply transforms when none are specified', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!

      const element = {
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

      return {
        transformRestored: initialState === finalState,
      }
    })

    expect(result.transformRestored).toBe(true)
  })
})
