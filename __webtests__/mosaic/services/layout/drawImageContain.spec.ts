import { expect, test } from '@playwright/test'

/**
 * 将 drawMediaContain 的 Jest 测试迁移到 Playwright
 * 使用真实浏览器的 Canvas API 并在页面上下文中断言
 */
test.describe('drawMediaContain', () => {
  async function setup(page) {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils?.drawMediaContain)
  }

  test('should draw wide image with contain fit (height-based scaling)', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMediaContain } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const drawImageCalls: any[] = []
      ctx.drawImage = ((original) =>
        function (...args: any[]) {
          drawImageCalls.push(args)
          return original.apply(this, args)
        })(ctx.drawImage)

      const img = new Image()
      img.width = 100
      img.height = 50

      const element = {
        fit: 'contain',
      }

      const pos = { x: 0, y: 0, width: 50, height: 50 }

      drawMediaContain(ctx, img, element, pos)

      const [call] = drawImageCalls
      return {
        calls: drawImageCalls.length,
        destX: call[1],
        destY: call[2],
        destWidth: call[3],
        destHeight: call[4],
      }
    })

    expect(result.calls).toBe(1)
    expect(result.destX).toBe(0)
    expect(result.destY).toBe(12.5)
    expect(result.destWidth).toBe(50)
    expect(result.destHeight).toBe(25)
  })

  test('should draw tall image with contain fit (width-based scaling)', async ({ page }) => {
    await setup(page)

    const result = await page.evaluate(() => {
      const { drawMediaContain } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const drawImageCalls: any[] = []
      ctx.drawImage = function (...args: any[]) {
        drawImageCalls.push(args)
      }

      const img = new Image()
      img.width = 50
      img.height = 100

      const element = {
        fit: 'contain',
      }

      const pos = { x: 0, y: 0, width: 50, height: 50 }

      drawMediaContain(ctx, img, element, pos)

      const [call] = drawImageCalls
      return {
        calls: drawImageCalls.length,
        destX: call[1],
        destY: call[2],
        destWidth: call[3],
        destHeight: call[4],
      }
    })

    expect(result.calls).toBe(1)
    expect(result.destX).toBe(12.5)
    expect(result.destY).toBe(0)
    expect(result.destWidth).toBe(25)
    expect(result.destHeight).toBe(50)
  })
})
