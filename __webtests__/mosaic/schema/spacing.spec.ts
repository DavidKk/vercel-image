import { adjustSchemaForSpacing } from '@/app/mosaic/services/layout/spacing'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('LayoutSchema spacing property', () => {
  it('should use schema spacing property as default value', () => {
    const schema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      spacing: 5, // 设置默认间距为5%
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          zIndex: 1,
          fit: 'cover',
        },
      ],
    }

    // 调用 adjustSchemaForSpacing 不传入 spacing 参数，应该使用 schema 中的默认值
    const adjustedSchema = adjustSchemaForSpacing({ schema })

    // 验证元素尺寸被正确调整（5% 间距应该使元素缩小到 95%）
    expect(adjustedSchema.elements[0].width).toBe('95%')
    expect(adjustedSchema.elements[0].height).toBe('95%')
  })

  it('should override schema spacing property when explicit value is provided', () => {
    const schema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      spacing: 5, // 设置默认间距为5%
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          zIndex: 1,
          fit: 'cover',
        },
      ],
    }

    // 调用 adjustSchemaForSpacing 传入显式的 spacing 值 10，应该覆盖 schema 中的默认值
    const adjustedSchema = adjustSchemaForSpacing({ schema, spacing: 10 })

    // 验证元素尺寸被正确调整（10% 间距应该使元素缩小到 90%）
    expect(adjustedSchema.elements[0].width).toBe('90%')
    expect(adjustedSchema.elements[0].height).toBe('90%')
  })

  it('should use 0 as default when no spacing is provided', () => {
    const schema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      // 不设置 spacing 属性
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          zIndex: 1,
          fit: 'cover',
        },
      ],
    }

    // 调用 adjustSchemaForSpacing 不传入 spacing 参数，应该使用 0 作为默认值
    const adjustedSchema = adjustSchemaForSpacing({ schema })

    // 验证元素尺寸未被调整（0% 间距应该保持元素尺寸不变）
    expect(adjustedSchema.elements[0].width).toBe('100%')
    expect(adjustedSchema.elements[0].height).toBe('100%')
  })
})
