import { expect, test } from '@playwright/test'

/**
 * Playwright 版本的 drawMediaFill 测试
 */
test.describe('drawMediaFill', () => {
  test('should draw image with fill fit (stretch to fill)', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils?.drawMediaFill)

    const result = await page.evaluate(() => {
      const { drawMediaFill } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const drawImageCalls: any[] = []
      ctx.drawImage = function (...args: any[]) {
        drawImageCalls.push(args)
      }

      const img = new Image()
      img.width = 100
      img.height = 50

      const element = { fit: 'fill' }
      const pos = { x: 10, y: 20, width: 80, height: 60 }

      drawMediaFill(ctx, img, element, pos)

      const [call] = drawImageCalls
      return {
        calls: drawImageCalls.length,
        destX: call[1],
        destY: call[2],
        destWidth: call[3],
        destHeight: call[4],
        imageWidth: img.width,
      }
    })

    expect(result.calls).toBe(1)
    expect(result.destX).toBe(10)
    expect(result.destY).toBe(20)
    expect(result.destWidth).toBe(80)
    expect(result.destHeight).toBe(60)
  })
})
