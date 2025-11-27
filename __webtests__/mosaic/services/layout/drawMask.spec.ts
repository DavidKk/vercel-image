import { expect, test } from '@playwright/test'

/**
 * Playwright 版本的 drawMask 测试
 */
test.describe('drawMask', () => {
  async function setup(page) {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils?.drawMask)
  }

  test('should not draw mask when element has no mask', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMask } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let clipCalled = false
      const originalClip = ctx.clip.bind(ctx)
      ctx.clip = function (...args: any[]) {
        clipCalled = true
        return originalClip(...args)
      }

      const element = { fit: 'cover' }
      drawMask(ctx, element, 10, 10, 100, 50)

      return { clipCalled }
    })

    expect(result.clipCalled).toBe(false)
  })

  test('should not draw mask when mask type is not shape', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMask } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let clipCalled = false
      ctx.clip = function () {
        clipCalled = true
      }

      const element = {
        fit: 'cover',
        mask: { type: 'image' },
      }

      drawMask(ctx, element, 10, 10, 100, 50)

      return { clipCalled }
    })

    expect(result.clipCalled).toBe(false)
  })

  test('should call drawShapeMask when mask type is shape', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMask } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let clipCalled = false
      ctx.clip = function () {
        clipCalled = true
      }

      const element = {
        fit: 'cover',
        mask: { type: 'shape', shape: 'circle' },
      }

      drawMask(ctx, element, 10, 10, 100, 50)

      return { clipCalled }
    })

    expect(result.clipCalled).toBe(true)
  })
})
