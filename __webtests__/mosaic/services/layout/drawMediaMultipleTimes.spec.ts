import { expect, test } from '@playwright/test'

/**
 * Playwright 版本的 drawMedia 多次调用测试
 */
test.describe('drawMedia multiple times', () => {
  async function setup(page) {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils?.drawMedia)
  }

  test('should be able to draw the same image multiple times', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const drawImageCalls: any[] = []
      ctx.drawImage = function (...args: any[]) {
        drawImageCalls.push(args)
      }

      const saveRestoreLog: string[] = []
      ctx.save = function () {
        saveRestoreLog.push('save')
      }
      ctx.restore = function () {
        saveRestoreLog.push('restore')
      }

      const img = new Image()
      img.width = 100
      img.height = 100

      const element = { fit: 'cover' }

      drawMedia(ctx, img, element, 200, 200, 0)
      drawMedia(ctx, img, element, 200, 200, 0)

      return {
        drawCallCount: drawImageCalls.length,
        firstImageMatch: drawImageCalls[0][0] === img,
        secondImageMatch: drawImageCalls[1][0] === img,
        log: saveRestoreLog,
      }
    })

    expect(result.drawCallCount).toBe(2)
    expect(result.firstImageMatch).toBe(true)
    expect(result.secondImageMatch).toBe(true)
    expect(result.log.filter((x) => x === 'save').length).toBeGreaterThan(0)
    expect(result.log.filter((x) => x === 'restore').length).toBeGreaterThan(0)
  })

  test('should save and restore context for each draw with effects', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const saveCalls: string[] = []
      ctx.save = function () {
        saveCalls.push('save')
      }
      const restoreCalls: string[] = []
      ctx.restore = function () {
        restoreCalls.push('restore')
      }

      const img = new Image()
      img.width = 100
      img.height = 100

      const element = {
        fit: 'cover',
        opacity: 0.5,
        blendMode: 'multiply',
      }

      drawMedia(ctx, img, element, 200, 200, 0)
      drawMedia(ctx, img, element, 200, 200, 0)

      return {
        saveCount: saveCalls.length,
        restoreCount: restoreCalls.length,
      }
    })

    expect(result.saveCount).toBe(2)
    expect(result.restoreCount).toBe(2)
  })
})
