import { grid } from '@/app/mosaic/schema/grid'
import { adjustSchemaForSpacing } from '@/app/mosaic/services/layout/spacing'

describe('Grid schema spacing', () => {
  it('should use grid schema default spacing value of 2', () => {
    // 调用 adjustSchemaForSpacing 不传入 spacing 参数，应该使用 grid schema 中的默认值 2
    const adjustedSchema = adjustSchemaForSpacing({ schema: grid })

    // 验证第一个元素的宽度和高度被正确调整
    // 第一个元素没有 spacingDirection，所以使用默认的 'both'，调整宽度和高度
    expect(adjustedSchema.elements[0].width).not.toBe('33.333%')
    expect(adjustedSchema.elements[0].height).not.toBe('33.333%')

    // 验证调整后的值符合预期 (2% 间距应该使元素缩小到 98% 的大小)
    // 33.333% * 0.98 = 32.66634%
    expect(adjustedSchema.elements[0].width).toBe('32.66634%')
    expect(adjustedSchema.elements[0].height).toBe('32.66634%')
  })

  it('should override grid schema spacing when explicit value is provided', () => {
    // 调用 adjustSchemaForSpacing 传入显式的 spacing 值 10，应该覆盖 schema 中的默认值
    const adjustedSchema = adjustSchemaForSpacing({ schema: grid, spacing: 10 })

    // 验证第一个元素的宽度和高度被正确调整
    // 第一个元素没有 spacingDirection，所以使用默认的 'both'，调整宽度和高度
    expect(adjustedSchema.elements[0].width).not.toBe('33.333%')
    expect(adjustedSchema.elements[0].height).not.toBe('33.333%')

    // 验证调整后的值符合预期 (10% 间距应该使元素缩小到 90% 的大小)
    // 33.333% * 0.90 = 29.9997%
    expect(adjustedSchema.elements[0].width).toBe('29.9997%')
    expect(adjustedSchema.elements[0].height).toBe('29.9997%')

    // 验证使用10%间距的结果与使用2%间距的结果不同
    const adjustedSchemaWithDefaultSpacing = adjustSchemaForSpacing({ schema: grid })
    expect(adjustedSchema.elements[0].width).not.toBe(adjustedSchemaWithDefaultSpacing.elements[0].width)
    expect(adjustedSchema.elements[0].height).not.toBe(adjustedSchemaWithDefaultSpacing.elements[0].height)
  })

  it('should not adjust elements when spacing is 0', () => {
    // 调用 adjustSchemaForSpacing 传入 spacing 值 0
    const adjustedSchema = adjustSchemaForSpacing({ schema: grid, spacing: 0 })

    // 验证元素尺寸未被调整
    expect(adjustedSchema.elements[0].width).toBe('33.333%')
    expect(adjustedSchema.elements[0].height).toBe('33.333%')

    // 验证元素位置未被调整
    expect(adjustedSchema.elements[0].x).toBe('0%')
    expect(adjustedSchema.elements[0].y).toBe('0%')
  })

  it('should use schema default spacing when no explicit value is provided', () => {
    // 调用 adjustSchemaForSpacing 不传入 spacing 参数
    const adjustedSchema = adjustSchemaForSpacing({ schema: grid })

    // 应该与传入显式值2的结果相同
    const adjustedSchemaWithExplicitValue = adjustSchemaForSpacing({ schema: grid, spacing: 2 })

    expect(adjustedSchema.elements[0].width).toBe(adjustedSchemaWithExplicitValue.elements[0].width)
    expect(adjustedSchema.elements[0].height).toBe(adjustedSchemaWithExplicitValue.elements[0].height)
    expect(adjustedSchema.elements[0].x).toBe(adjustedSchemaWithExplicitValue.elements[0].x)
    expect(adjustedSchema.elements[0].y).toBe(adjustedSchemaWithExplicitValue.elements[0].y)
  })
})
