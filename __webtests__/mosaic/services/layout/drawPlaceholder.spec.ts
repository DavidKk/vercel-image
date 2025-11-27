import { expect, test } from '@playwright/test'

/**
 * 将 Jest 测试迁移到 Playwright
 * 使用真实浏览器的 canvas API
 */
test.describe('drawPlaceholder', () => {
  test('should draw placeholder with default background color', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const element = {
        x: '10%',
        y: '10%',
        width: '80%',
        height: '80%',
        fit: 'cover',
      }

      const imageDataBefore = ctx.getImageData(0, 0, 100, 100)
      const beforeData = Array.from(imageDataBefore.data)

      drawPlaceholder(ctx, element, 100, 100)

      const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
      const afterData = Array.from(imageDataAfter.data)

      return {
        changed: JSON.stringify(beforeData) !== JSON.stringify(afterData),
      }
    })

    expect(result.changed).toBe(true)
  })

  test('should draw placeholder with custom background color', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        backgroundColor: '#ff0000',
        fit: 'cover',
      }

      let error = null
      try {
        drawPlaceholder(ctx, element, 100, 100)
      } catch (e: any) {
        error = e.message
      }

      return {
        noError: error === null,
      }
    })

    expect(result.noError).toBe(true)
  })

  test('should draw placeholder with border radius', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawPlaceholder } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        borderRadius: 10,
        fit: 'cover',
      }

      const imageDataBefore = ctx.getImageData(0, 0, 100, 100)
      const beforeData = Array.from(imageDataBefore.data)

      drawPlaceholder(ctx, element, 100, 100)

      const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
      const afterData = Array.from(imageDataAfter.data)

      return {
        changed: JSON.stringify(beforeData) !== JSON.stringify(afterData),
      }
    })

    expect(result.changed).toBe(true)
  })
})
