import { expect, test } from '@playwright/test'

/**
 * 将 Jest 测试迁移到 Playwright
 * 使用真实浏览器的 canvas API
 */
test.describe('drawBackground', () => {
  test('should draw white background', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawBackground } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const schema = {
        canvasWidth: 100,
        canvasHeight: 100,
        elements: [],
      }

      drawBackground(ctx, schema)

      // 验证背景颜色是否设置正确
      const fillStyle = ctx.fillStyle

      // 验证是否绘制了正确的矩形区域
      const imageData = ctx.getImageData(0, 0, 100, 100)
      // 检查是否有非透明像素
      let hasNonTransparentPixel = false
      for (let i = 0; i < imageData.data.length; i += 4) {
        const alpha = imageData.data[i + 3]
        if (alpha > 0) {
          hasNonTransparentPixel = true
          break
        }
      }

      return {
        fillStyle: fillStyle.toString(),
        hasNonTransparentPixel,
      }
    })

    expect(result.fillStyle).toBe('#ffffff')
    expect(result.hasNonTransparentPixel).toBe(true)
  })

  test('should draw background with different dimensions', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawBackground } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const schema = {
        canvasWidth: 200,
        canvasHeight: 150,
        elements: [],
      }

      drawBackground(ctx, schema)

      // 验证背景颜色是否设置正确
      const fillStyle = ctx.fillStyle

      // 验证是否绘制了正确的矩形区域
      const imageData = ctx.getImageData(0, 0, 200, 150)
      // 检查是否有非透明像素
      let hasNonTransparentPixel = false
      for (let i = 0; i < imageData.data.length; i += 4) {
        const alpha = imageData.data[i + 3]
        if (alpha > 0) {
          hasNonTransparentPixel = true
          break
        }
      }

      return {
        fillStyle: fillStyle.toString(),
        hasNonTransparentPixel,
      }
    })

    expect(result.fillStyle).toBe('#ffffff')
    expect(result.hasNonTransparentPixel).toBe(true)
  })
})
