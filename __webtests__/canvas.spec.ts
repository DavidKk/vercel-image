import { expect, test } from '@playwright/test'

test.describe('Canvas functionality', () => {
  test('should have access to document object', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')

    const hasDocument = await page.evaluate(() => {
      return typeof document !== 'undefined' && typeof document.createElement === 'function'
    })

    expect(hasDocument).toBe(true)
  })

  test('should be able to create canvas element', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')

    const canvasInfo = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      return {
        defined: canvas !== null,
        hasGetContext: typeof canvas.getContext === 'function',
      }
    })

    expect(canvasInfo.defined).toBe(true)
    expect(canvasInfo.hasGetContext).toBe(true)
  })

  test('should be able to set canvas dimensions', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')

    const dimensions = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 400
      return {
        width: canvas.width,
        height: canvas.height,
      }
    })

    expect(dimensions.width).toBe(600)
    expect(dimensions.height).toBe(400)
  })
})
