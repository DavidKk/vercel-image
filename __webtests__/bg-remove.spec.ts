import { expect, test } from '@playwright/test'
import path from 'path'

test.describe('背景去除工具', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/progress')
  })

  test('应该显示页面标题和说明', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /SmartBGRemove/i })).toBeVisible()
    await expect(page.getByText(/纯前端图片背景去除工具/)).toBeVisible()
  })

  test('应该能够上传图片并自动检测纯色背景', async ({ page }) => {
    // 上传 logo.png 图片
    const logoPath = path.join(__dirname, '../public/logo.png')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(logoPath)

    // 等待图片加载
    await page.waitForTimeout(1000)

    // 检查是否显示检测结果或画布编辑器
    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 5000 })

    // 检查是否有检测到纯色背景的提示（如果有）
    const detectionMessage = page.locator('text=/检测到纯色背景/')
    const hasDetection = await detectionMessage.isVisible().catch(() => false)

    if (hasDetection) {
      // 如果检测到纯色背景，应该自动处理
      await page.waitForTimeout(2000) // 等待自动处理完成

      // 检查预览区域是否显示
      const previewCanvas = page.locator('canvas').nth(1)
      await expect(previewCanvas).toBeVisible({ timeout: 5000 })
    }
  })

  test('应该能够手动去除背景', async ({ page }) => {
    // 上传图片
    const logoPath = path.join(__dirname, '../public/logo.png')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(logoPath)
    await page.waitForTimeout(1000)

    // 等待画布出现
    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 5000 })

    // 点击"去除背景"按钮
    const removeButton = page.getByRole('button', { name: /去除背景/i })
    await expect(removeButton).toBeVisible()
    await removeButton.click()

    // 等待处理完成
    await page.waitForTimeout(2000)

    // 检查预览区域是否更新
    const previewCanvas = page.locator('canvas').nth(1)
    await expect(previewCanvas).toBeVisible({ timeout: 5000 })
  })

  test('应该能够调整容差', async ({ page }) => {
    // 上传图片
    const logoPath = path.join(__dirname, '../public/logo.png')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(logoPath)
    await page.waitForTimeout(1000)

    // 查找容差滑块
    const toleranceSlider = page.locator('input[type="range"]')
    await expect(toleranceSlider).toBeVisible()

    // 调整容差
    await toleranceSlider.fill('20')

    // 验证容差值显示更新
    await expect(page.locator('text=/容差: 20/')).toBeVisible()
  })

  test('应该能够切换工具模式', async ({ page }) => {
    // 检查工具按钮
    const lassoButton = page.getByRole('button', { name: /圈选/i })
    const rectButton = page.getByRole('button', { name: /矩形/i })
    const eraseButton = page.getByRole('button', { name: /橡皮擦/i })

    await expect(lassoButton).toBeVisible()
    await expect(rectButton).toBeVisible()
    await expect(eraseButton).toBeVisible()

    // 切换到矩形模式
    await rectButton.click()
    await expect(rectButton).toHaveClass(/bg-blue-500/)

    // 切换回圈选模式
    await lassoButton.click()
    await expect(lassoButton).toHaveClass(/bg-blue-500/)
  })

  test('应该能够下载处理后的图片', async ({ page }) => {
    // 上传图片
    const logoPath = path.join(__dirname, '../public/logo.png')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(logoPath)
    await page.waitForTimeout(1000)

    // 等待画布出现
    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 5000 })

    // 点击去除背景
    const removeButton = page.getByRole('button', { name: /去除背景/i })
    await removeButton.click()
    await page.waitForTimeout(2000)

    // 设置下载监听
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })

    // 点击下载按钮
    const downloadButton = page.getByRole('button', { name: /下载 PNG/i })
    await expect(downloadButton).toBeVisible()
    await downloadButton.click()

    // 等待下载完成
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('ai-processed.png')
  })

  test('应该能够重置图片', async ({ page }) => {
    // 上传图片
    const logoPath = path.join(__dirname, '../public/logo.png')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(logoPath)
    await page.waitForTimeout(1000)

    // 等待画布出现
    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 5000 })

    // 点击去除背景
    const removeButton = page.getByRole('button', { name: /去除背景/i })
    await removeButton.click()
    await page.waitForTimeout(2000)

    // 点击重置按钮
    const resetButton = page.getByRole('button', { name: /重置/i })
    await expect(resetButton).toBeVisible()
    await resetButton.click()

    // 验证画布仍然存在
    await expect(canvasEditor).toBeVisible()
  })

  test('应该能够改变背景色预览', async ({ page }) => {
    // 上传图片
    const logoPath = path.join(__dirname, '../public/logo.png')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(logoPath)
    await page.waitForTimeout(1000)

    // 等待画布出现
    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 5000 })

    // 点击去除背景
    const removeButton = page.getByRole('button', { name: /去除背景/i })
    await removeButton.click()
    await page.waitForTimeout(2000)

    // 查找颜色选择器
    const colorInput = page.locator('input[type="color"]')
    await expect(colorInput).toBeVisible()

    // 改变背景色
    await colorInput.fill('#ff0000')

    // 验证预览区域仍然存在
    const previewCanvas = page.locator('canvas').nth(1)
    await expect(previewCanvas).toBeVisible()
  })

  test('应该能够使用圈选工具选择区域', async ({ page }) => {
    // 上传图片
    const logoPath = path.join(__dirname, '../public/logo.png')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(logoPath)
    await page.waitForTimeout(1000)

    // 等待画布出现
    const canvasEditor = page.locator('canvas').first()
    await expect(canvasEditor).toBeVisible({ timeout: 5000 })

    // 确保在圈选模式
    const lassoButton = page.getByRole('button', { name: /圈选/i })
    await lassoButton.click()

    // 获取画布位置和尺寸
    const canvasBox = await canvasEditor.boundingBox()
    if (!canvasBox) {
      throw new Error('无法获取画布位置')
    }

    // 在画布上绘制路径（模拟圈选）
    await canvasEditor.click({
      position: { x: canvasBox.width * 0.3, y: canvasBox.height * 0.3 },
    })

    // 移动鼠标绘制路径
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.4, canvasBox.y + canvasBox.height * 0.3)
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.4, canvasBox.y + canvasBox.height * 0.4)
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.3, canvasBox.y + canvasBox.height * 0.4)

    // 释放鼠标
    await page.mouse.up()

    // 等待路径更新
    await page.waitForTimeout(500)

    // 点击去除背景
    const removeButton = page.getByRole('button', { name: /去除背景/i })
    await removeButton.click()
    await page.waitForTimeout(2000)

    // 验证预览区域更新
    const previewCanvas = page.locator('canvas').nth(1)
    await expect(previewCanvas).toBeVisible()
  })
})
