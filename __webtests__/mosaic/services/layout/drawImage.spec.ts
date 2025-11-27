import { expect, test } from '@playwright/test'

/**
 * 将 Jest 测试迁移到 Playwright
 * 使用真实浏览器的 canvas API
 */
test.describe('drawMedia', () => {
  test('should draw image with default fit (cover)', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    // 等待测试工具加载
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      // 从全局测试工具获取函数
      const { drawMedia } = (window as any).__testUtils

      // 创建 canvas
      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      // 创建图像 canvas
      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = 100
      imageCanvas.height = 100
      const imageCtx = imageCanvas.getContext('2d')!
      imageCtx.fillStyle = 'red'
      imageCtx.fillRect(0, 0, 100, 100)

      // 保存绘制前的像素数据
      const imageDataBefore = ctx.getImageData(0, 0, 100, 100)
      const beforeData = Array.from(imageDataBefore.data)

      // 执行绘制
      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        fit: 'cover',
      }

      drawMedia(ctx, imageCanvas, element, 100, 100, 0)

      // 获取绘制后的像素数据
      const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
      const afterData = Array.from(imageDataAfter.data)

      // 比较数据是否不同
      return {
        changed: JSON.stringify(beforeData) !== JSON.stringify(afterData),
        beforeSum: beforeData.reduce((a, b) => a + b, 0),
        afterSum: afterData.reduce((a, b) => a + b, 0),
      }
    })

    expect(result.changed).toBe(true)
  })

  test('should draw image with contain fit', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = 100
      imageCanvas.height = 100
      const imageCtx = imageCanvas.getContext('2d')!
      imageCtx.fillStyle = 'red'
      imageCtx.fillRect(0, 0, 100, 100)

      const imageDataBefore = ctx.getImageData(0, 0, 100, 100)
      const beforeData = Array.from(imageDataBefore.data)

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        fit: 'contain',
      }

      drawMedia(ctx, imageCanvas, element, 100, 100, 0)

      const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
      const afterData = Array.from(imageDataAfter.data)

      return {
        changed: JSON.stringify(beforeData) !== JSON.stringify(afterData),
      }
    })

    expect(result.changed).toBe(true)
  })

  test('should draw image with fill fit', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = 100
      imageCanvas.height = 100
      const imageCtx = imageCanvas.getContext('2d')!
      imageCtx.fillStyle = 'red'
      imageCtx.fillRect(0, 0, 100, 100)

      const imageDataBefore = ctx.getImageData(0, 0, 100, 100)
      const beforeData = Array.from(imageDataBefore.data)

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        fit: 'fill',
      }

      drawMedia(ctx, imageCanvas, element, 100, 100, 0)

      const imageDataAfter = ctx.getImageData(0, 0, 100, 100)
      const afterData = Array.from(imageDataAfter.data)

      return {
        changed: JSON.stringify(beforeData) !== JSON.stringify(afterData),
      }
    })

    expect(result.changed).toBe(true)
  })

  test('should apply opacity', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = 100
      imageCanvas.height = 100
      const imageCtx = imageCanvas.getContext('2d')!
      imageCtx.fillStyle = 'red'
      imageCtx.fillRect(0, 0, 100, 100)

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        fit: 'cover',
        opacity: 0.5,
      }

      // 验证函数执行不会抛出异常
      let error = null
      try {
        drawMedia(ctx, imageCanvas, element, 100, 100, 0)
      } catch (e) {
        error = e.message
      }

      return {
        noError: error === null,
      }
    })

    expect(result.noError).toBe(true)
  })

  test('should apply shadow', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = 100
      imageCanvas.height = 100
      const imageCtx = imageCanvas.getContext('2d')!
      imageCtx.fillStyle = 'red'
      imageCtx.fillRect(0, 0, 100, 100)

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        fit: 'cover',
        shadow: {
          x: 5,
          y: 10,
          blur: 3,
          color: '#000000',
        },
      }

      let error = null
      try {
        drawMedia(ctx, imageCanvas, element, 100, 100, 0)
      } catch (e) {
        error = e.message
      }

      return {
        noError: error === null,
      }
    })

    expect(result.noError).toBe(true)
  })

  test('should apply blend mode', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = 100
      imageCanvas.height = 100
      const imageCtx = imageCanvas.getContext('2d')!
      imageCtx.fillStyle = 'red'
      imageCtx.fillRect(0, 0, 100, 100)

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        fit: 'cover',
        blendMode: 'multiply',
      }

      let error = null
      try {
        drawMedia(ctx, imageCanvas, element, 100, 100, 0)
      } catch (e) {
        error = e.message
      }

      return {
        noError: error === null,
      }
    })

    expect(result.noError).toBe(true)
  })

  test('should apply border radius', async ({ page }) => {
    await page.goto('/test-utils/canvas-test')
    await page.waitForFunction(() => (window as any).__testUtils !== undefined)

    const result = await page.evaluate(async () => {
      const { drawMedia } = (window as any).__testUtils

      const canvas = document.createElement('canvas')
      canvas.width = 300
      canvas.height = 150
      const ctx = canvas.getContext('2d')!

      const imageCanvas = document.createElement('canvas')
      imageCanvas.width = 100
      imageCanvas.height = 100
      const imageCtx = imageCanvas.getContext('2d')!
      imageCtx.fillStyle = 'red'
      imageCtx.fillRect(0, 0, 100, 100)

      // 保存原始的 clip 方法调用次数
      let clipCallCount = 0
      const originalClip = ctx.clip.bind(ctx)
      ctx.clip = function () {
        clipCallCount++
        return originalClip()
      }

      const element = {
        x: '0%',
        y: '0%',
        width: '100%',
        height: '100%',
        fit: 'cover',
        borderRadius: 10,
      }

      drawMedia(ctx, imageCanvas, element, 100, 100, 0)

      return {
        clipCalled: clipCallCount > 0,
      }
    })

    expect(result.clipCalled).toBe(true)
  })
})
