import { expect, test } from '@playwright/test'

/**
 * 将 Jest 测试迁移到 Playwright
 * 这个测试不涉及 canvas，但迁移到 Playwright 以保持一致性
 */
test.describe('calculateElementPosition', () => {
  test('should calculate position with percentage values', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { calculateElementPosition } = (window as any).__testUtils

      const element = {
        x: '25%',
        y: '25%',
        width: '50%',
        height: '50%',
        fit: 'cover',
      }

      const result = calculateElementPosition(element, 100, 100)

      return {
        x: result.x,
        y: result.y,
        width: result.width,
        height: result.height,
      }
    })

    expect(result.x).toBe(25)
    expect(result.y).toBe(25)
    expect(result.width).toBe(50)
    expect(result.height).toBe(50)
  })

  test('should calculate position with pixel values', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { calculateElementPosition } = (window as any).__testUtils

      const element = {
        x: 10,
        y: 20,
        width: 50,
        height: 60,
        fit: 'cover',
      }

      const result = calculateElementPosition(element, 100, 100)

      return {
        x: result.x,
        y: result.y,
        width: result.width,
        height: result.height,
      }
    })

    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(50)
    expect(result.height).toBe(60)
  })

  test('should handle mixed percentage and pixel values', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { calculateElementPosition } = (window as any).__testUtils

      const element = {
        x: '10%',
        y: 20,
        width: '50%',
        height: 60,
        fit: 'cover',
      }

      const result = calculateElementPosition(element, 100, 100)

      return {
        x: result.x,
        y: result.y,
        width: result.width,
        height: result.height,
      }
    })

    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(50)
    expect(result.height).toBe(60)
  })
})
