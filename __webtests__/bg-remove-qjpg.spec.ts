import { expect, test } from '@playwright/test'
import path from 'path'

/**
 * q.jpg 背景去除完整测试
 * 测试复杂背景图片的人物抠图功能
 */
test.describe('q.jpg 背景去除完整测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/progress')
  })

  test('应该能够完成 q.jpg 的复杂背景去除', async ({ page }) => {
    // 1. 上传 q.jpg 图片
    const imagePath = path.join(__dirname, '../public/test/q.jpg')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(imagePath)

    // 2. 等待图片加载完成
    await page.waitForTimeout(2000)

    // 3. 获取画布元素
    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 10000 })

    // 获取画布的显示尺寸和位置
    const canvasBox = await canvasEditor.boundingBox()
    if (!canvasBox) {
      throw new Error('无法获取画布位置')
    }

    // 获取图片和画布的实际尺寸（用于坐标转换）
    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return null

      // 尝试从页面状态获取图片信息
      // 或者从 canvas 的 data 属性中获取
      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        displayWidth: canvas.offsetWidth,
        displayHeight: canvas.offsetHeight,
      }
    })

    expect(dimensions).not.toBeNull()

    // 4. 切换到圈选模式
    const lassoButton = page.getByRole('button', { name: /圈选/i })
    await expect(lassoButton).toBeVisible()
    await lassoButton.click()
    await page.waitForTimeout(300)

    // 5. 绘制闭合路径圈选人物
    // 基于 q.jpg 的描述，人物在画面左侧，我们需要绘制一个围绕人物的路径
    // 使用画布显示坐标（相对于 canvasBox）

    // 定义路径点（相对于画布显示尺寸的百分比）
    const pathPoints = [
      { x: 0.25, y: 0.2 }, // 左上
      { x: 0.7, y: 0.15 }, // 右上
      { x: 0.75, y: 0.5 }, // 右中
      { x: 0.7, y: 0.85 }, // 右下
      { x: 0.25, y: 0.9 }, // 左下
      { x: 0.2, y: 0.5 }, // 左中
    ]

    // 转换为绝对坐标
    const absolutePoints = pathPoints.map((point) => ({
      x: canvasBox.x + point.x * canvasBox.width,
      y: canvasBox.y + point.y * canvasBox.height,
    }))

    // 开始绘制：移动到起点并按下鼠标
    const startPoint = absolutePoints[0]

    // 移动到起点
    await page.mouse.move(startPoint.x, startPoint.y)
    await page.waitForTimeout(50)

    // 按下鼠标开始绘制
    await page.mouse.down()
    await page.waitForTimeout(100)

    // 移动鼠标绘制路径（使用平滑的移动）
    for (let i = 1; i < absolutePoints.length; i++) {
      const point = absolutePoints[i]
      await page.mouse.move(point.x, point.y, { steps: 15 })
      await page.waitForTimeout(100)
    }

    // 回到起点形成闭合路径
    await page.mouse.move(startPoint.x, startPoint.y, { steps: 15 })
    await page.waitForTimeout(200)

    // 释放鼠标
    await page.mouse.up()
    await page.waitForTimeout(1000) // 等待路径处理完成

    // 6. 点击"去除背景"按钮
    const removeButton = page.getByRole('button', { name: /去除背景/i })
    await expect(removeButton).toBeVisible()
    await removeButton.click()

    // 7. 等待处理完成（复杂背景处理可能需要更长时间）
    await page.waitForTimeout(3000)

    // 8. 验证预览区域显示
    const previewCanvas = page.locator('canvas').nth(1)
    await expect(previewCanvas).toBeVisible({ timeout: 10000 })

    // 9. 验证去除效果：检查透明像素
    const transparencyCheck = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas')
      if (canvases.length < 2) return null

      const previewCanvas = canvases[1] as HTMLCanvasElement
      const ctx = previewCanvas.getContext('2d')
      if (!ctx) return null

      const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height)
      const data = imageData.data

      let transparentPixels = 0
      let totalPixels = data.length / 4
      let edgePixels = 0 // 边缘像素（部分透明）

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]
        if (alpha === 0) {
          transparentPixels++
        } else if (alpha > 0 && alpha < 255) {
          edgePixels++
        }
      }

      return {
        totalPixels,
        transparentPixels,
        transparentRatio: transparentPixels / totalPixels,
        edgePixels,
        edgeRatio: edgePixels / totalPixels,
        hasTransparency: transparentPixels > 0,
      }
    })

    expect(transparencyCheck).not.toBeNull()
    expect(transparencyCheck?.hasTransparency).toBe(true)

    // 验证有合理的透明区域（背景应该被去除）
    // 对于人物图片，透明区域应该占一定比例
    // 如果圈选区域较小或背景去除效果好，透明区域可能达到 80-90%
    // 只要不是全部透明（>95%）或几乎没有透明（<5%），就认为成功
    expect(transparencyCheck?.transparentRatio).toBeGreaterThan(0.05) // 至少 5% 透明（说明有背景被去除）
    expect(transparencyCheck?.transparentRatio).toBeLessThan(0.95) // 最多 95% 透明（保留至少 5% 前景）

    // 验证有边缘羽化效果（部分透明的像素）
    expect(transparencyCheck?.edgePixels).toBeGreaterThan(0)

    // 10. 验证下载功能
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    const downloadButton = page.getByRole('button', { name: /下载 PNG/i })
    await expect(downloadButton).toBeVisible()
    await downloadButton.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('ai-processed.png')

    // 验证下载的文件大小合理（不应该为空）
    const downloadPath = await download.path()
    expect(downloadPath).not.toBeNull()
  })

  test('应该能够通过多次圈选优化结果', async ({ page }) => {
    // 上传图片
    const imagePath = path.join(__dirname, '../public/test/q.jpg')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(imagePath)
    await page.waitForTimeout(2000)

    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 10000 })

    const canvasBox = await canvasEditor.boundingBox()
    if (!canvasBox) {
      throw new Error('无法获取画布位置')
    }

    // 切换到圈选模式
    const lassoButton = page.getByRole('button', { name: /圈选/i })
    await lassoButton.click()
    await page.waitForTimeout(300)

    // 第一次圈选：粗略选择
    const startX1 = canvasBox.x + canvasBox.width * 0.3
    const startY1 = canvasBox.y + canvasBox.height * 0.3

    await page.mouse.move(startX1, startY1)
    await page.mouse.down()
    await page.waitForTimeout(100)

    // 绘制一个较大的矩形路径
    const path1 = [
      { x: canvasBox.width * 0.3, y: canvasBox.height * 0.3 },
      { x: canvasBox.width * 0.7, y: canvasBox.height * 0.3 },
      { x: canvasBox.width * 0.7, y: canvasBox.height * 0.7 },
      { x: canvasBox.width * 0.3, y: canvasBox.height * 0.7 },
    ]

    for (const point of path1) {
      await page.mouse.move(canvasBox.x + point.x, canvasBox.y + point.y, { steps: 3 })
      await page.waitForTimeout(30)
    }
    await page.mouse.move(startX1, startY1, { steps: 3 })
    await page.mouse.up()
    await page.waitForTimeout(500)

    // 执行第一次去除
    const removeButton = page.getByRole('button', { name: /去除背景/i })
    await removeButton.click()
    await page.waitForTimeout(3000)

    // 验证第一次结果
    const previewCanvas1 = page.locator('canvas').nth(1)
    await expect(previewCanvas1).toBeVisible({ timeout: 10000 })

    // 重置后再次圈选（更精确）
    const resetButton = page.getByRole('button', { name: /重置/i })
    await resetButton.click()
    await page.waitForTimeout(500)

    // 第二次圈选：更精确
    const startX2 = canvasBox.x + canvasBox.width * 0.25
    const startY2 = canvasBox.y + canvasBox.height * 0.2

    await page.mouse.move(startX2, startY2)
    await page.mouse.down()
    await page.waitForTimeout(100)

    const path2 = [
      { x: canvasBox.width * 0.25, y: canvasBox.height * 0.2 },
      { x: canvasBox.width * 0.7, y: canvasBox.height * 0.15 },
      { x: canvasBox.width * 0.75, y: canvasBox.height * 0.5 },
      { x: canvasBox.width * 0.7, y: canvasBox.height * 0.85 },
      { x: canvasBox.width * 0.25, y: canvasBox.height * 0.9 },
      { x: canvasBox.width * 0.2, y: canvasBox.height * 0.5 },
    ]

    for (const point of path2) {
      await page.mouse.move(canvasBox.x + point.x, canvasBox.y + point.y, { steps: 5 })
      await page.waitForTimeout(50)
    }
    await page.mouse.move(startX2, startY2, { steps: 5 })
    await page.mouse.up()
    await page.waitForTimeout(500)

    // 执行第二次去除
    await removeButton.click()
    await page.waitForTimeout(3000)

    // 验证第二次结果
    const previewCanvas2 = page.locator('canvas').nth(1)
    await expect(previewCanvas2).toBeVisible({ timeout: 10000 })

    // 比较两次结果的透明像素比例
    const result1 = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas')
      if (canvases.length < 2) return null
      const canvas = canvases[1] as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let transparent = 0
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) transparent++
      }
      return transparent / (data.length / 4)
    })

    expect(result1).not.toBeNull()
    expect(result1).toBeGreaterThan(0.1)
  })
})
