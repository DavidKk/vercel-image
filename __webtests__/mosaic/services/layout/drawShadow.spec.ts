import { expect, test } from '@playwright/test'

/**
 * Playwright 版本的 drawShadow 测试
 */
test.describe('drawShadow', () => {
  async function setup(page) {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils?.drawShadow)
  }

  test('should not set shadow properties when element has no shadow', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawShadow } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const original = {
        color: ctx.shadowColor,
        blur: ctx.shadowBlur,
        offsetX: ctx.shadowOffsetX,
        offsetY: ctx.shadowOffsetY,
      }

      const element = { fit: 'cover' }

      drawShadow(ctx, element, 10, 10, 100, 50)

      return {
        colorUnchanged: ctx.shadowColor === original.color,
        blurUnchanged: ctx.shadowBlur === original.blur,
        offsetXUnchanged: ctx.shadowOffsetX === original.offsetX,
        offsetYUnchanged: ctx.shadowOffsetY === original.offsetY,
      }
    })

    expect(result.colorUnchanged).toBe(true)
    expect(result.blurUnchanged).toBe(true)
    expect(result.offsetXUnchanged).toBe(true)
    expect(result.offsetYUnchanged).toBe(true)
  })

  test('should set shadow properties when element has shadow', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawShadow } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const element = {
        fit: 'cover',
        shadow: {
          x: 5,
          y: 10,
          blur: 3,
          color: '#000000',
        },
      }

      drawShadow(ctx, element, 10, 10, 100, 50)

      return {
        shadowColor: ctx.shadowColor,
        shadowBlur: ctx.shadowBlur,
        shadowOffsetX: ctx.shadowOffsetX,
        shadowOffsetY: ctx.shadowOffsetY,
      }
    })

    expect(result.shadowColor).toBe('#000000')
    expect(result.shadowBlur).toBe(3)
    expect(result.shadowOffsetX).toBe(5)
    expect(result.shadowOffsetY).toBe(10)
  })
})
