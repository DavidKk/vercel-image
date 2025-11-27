import { expect, test } from '@playwright/test'

/**
 * Playwright 版本的 drawRoundedRectPath 测试
 */
test.describe('drawRoundedRectPath', () => {
  async function setup(page) {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils?.drawRoundedRectPath)
  }

  test('should draw rounded rectangle path', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawRoundedRectPath } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let beginPathCalled = false
      ctx.beginPath = function (...args: any[]) {
        beginPathCalled = true
        return CanvasRenderingContext2D.prototype.beginPath.apply(this, args)
      }

      let moveToCalled = false
      ctx.moveTo = function (...args: any[]) {
        moveToCalled = true
        return CanvasRenderingContext2D.prototype.moveTo.apply(this, args)
      }

      let lineToCalled = false
      ctx.lineTo = function (...args: any[]) {
        lineToCalled = true
        return CanvasRenderingContext2D.prototype.lineTo.apply(this, args)
      }

      let quadraticCurveToCalled = false
      ctx.quadraticCurveTo = function (...args: any[]) {
        quadraticCurveToCalled = true
        return CanvasRenderingContext2D.prototype.quadraticCurveTo.apply(this, args)
      }

      let closePathCalled = false
      ctx.closePath = function (...args: any[]) {
        closePathCalled = true
        return CanvasRenderingContext2D.prototype.closePath.apply(this, args)
      }

      drawRoundedRectPath(ctx, 10, 10, 100, 50, 5)

      return {
        beginPathCalled,
        moveToCalled,
        lineToCalled,
        quadraticCurveToCalled,
        closePathCalled,
      }
    })

    expect(result.beginPathCalled).toBe(true)
    expect(result.moveToCalled).toBe(true)
    expect(result.lineToCalled).toBe(true)
    expect(result.quadraticCurveToCalled).toBe(true)
    expect(result.closePathCalled).toBe(true)
  })

  test('should handle zero border radius', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawRoundedRectPath } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let beginPathCalled = false
      let moveToCalled = false
      let lineToCalled = false
      let quadraticCurveToCalled = false
      let closePathCalled = false

      ctx.beginPath = function (...args: any[]) {
        beginPathCalled = true
        return CanvasRenderingContext2D.prototype.beginPath.apply(this, args)
      }
      ctx.moveTo = function (...args: any[]) {
        moveToCalled = true
        return CanvasRenderingContext2D.prototype.moveTo.apply(this, args)
      }
      ctx.lineTo = function (...args: any[]) {
        lineToCalled = true
        return CanvasRenderingContext2D.prototype.lineTo.apply(this, args)
      }
      ctx.quadraticCurveTo = function (...args: any[]) {
        quadraticCurveToCalled = true
        return CanvasRenderingContext2D.prototype.quadraticCurveTo.apply(this, args)
      }
      ctx.closePath = function (...args: any[]) {
        closePathCalled = true
        return CanvasRenderingContext2D.prototype.closePath.apply(this, args)
      }

      drawRoundedRectPath(ctx, 0, 0, 50, 30, 0)

      return {
        beginPathCalled,
        moveToCalled,
        lineToCalled,
        quadraticCurveToCalled,
        closePathCalled,
      }
    })

    expect(result.beginPathCalled).toBe(true)
    expect(result.moveToCalled).toBe(true)
    expect(result.lineToCalled).toBe(true)
    expect(result.quadraticCurveToCalled).toBe(true)
    expect(result.closePathCalled).toBe(true)
  })
})
