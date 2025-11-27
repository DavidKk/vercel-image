import { expect, test } from '@playwright/test'

/**
 * Playwright 版本的 drawMediaCover 测试
 */
test.describe('drawMediaCover', () => {
  async function setup(page) {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils?.drawMediaCover)
  }

  test('should draw wide image with cover fit (height-based scaling)', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMediaCover } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const drawImageCalls: any[] = []
      ctx.drawImage = function (...args: any[]) {
        drawImageCalls.push(args)
      }

      const img = new Image()
      img.width = 100
      img.height = 50

      const element = { fit: 'cover' }
      const pos = { x: 0, y: 0, width: 50, height: 50 }

      drawMediaCover(ctx, img, element, pos)

      const [call] = drawImageCalls
      return {
        calls: drawImageCalls.length,
        sourceX: call[1],
        sourceY: call[2],
        sourceWidth: call[3],
        sourceHeight: call[4],
        destX: call[5],
        destY: call[6],
        destWidth: call[7],
        destHeight: call[8],
      }
    })

    expect(result.calls).toBe(1)
    expect(result.sourceX).toBe(25)
    expect(result.sourceY).toBe(0)
    expect(result.sourceWidth).toBe(50)
    expect(result.sourceHeight).toBe(50)
    expect(result.destX).toBe(0)
    expect(result.destY).toBe(0)
    expect(result.destWidth).toBe(50)
    expect(result.destHeight).toBe(50)
  })

  test('should draw tall image with cover fit (width-based scaling)', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMediaCover } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const drawImageCalls: any[] = []
      ctx.drawImage = function (...args: any[]) {
        drawImageCalls.push(args)
      }

      const img = new Image()
      img.width = 50
      img.height = 100

      const element = { fit: 'cover' }
      const pos = { x: 0, y: 0, width: 50, height: 50 }

      drawMediaCover(ctx, img, element, pos)

      const [call] = drawImageCalls
      return {
        calls: drawImageCalls.length,
        sourceX: call[1],
        sourceY: call[2],
        sourceWidth: call[3],
        sourceHeight: call[4],
        destX: call[5],
        destY: call[6],
        destWidth: call[7],
        destHeight: call[8],
      }
    })

    expect(result.calls).toBe(1)
    expect(result.sourceX).toBe(0)
    expect(result.sourceY).toBe(25)
    expect(result.sourceWidth).toBe(50)
    expect(result.sourceHeight).toBe(50)
    expect(result.destX).toBe(0)
    expect(result.destY).toBe(0)
    expect(result.destWidth).toBe(50)
    expect(result.destHeight).toBe(50)
  })
})
