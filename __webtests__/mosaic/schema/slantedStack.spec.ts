import { slantedStack } from '@/app/mosaic/schema/slantedStack'
import { adjustSchemaForSpacing } from '@/app/mosaic/services/layout/spacing'

describe('slantedStack schema', () => {
  test('should have horizontal spacingDirection for all elements', () => {
    // 验证所有元素都有 horizontal spacingDirection
    slantedStack.elements.forEach((element, index) => {
      expect(element.spacingDirection).toBe('horizontal')
      expect(element.height).toBe('100%')
    })
  })

  test('should maintain 100% height when applying spacing', () => {
    // 应用间距调整
    const adjustedSchema = adjustSchemaForSpacing({ schema: slantedStack, spacing: 2 })

    // 验证所有元素的高度仍然保持 100%
    adjustedSchema.elements.forEach((element, index) => {
      expect(element.height).toBe('100%')
      expect(element.spacingDirection).toBe('horizontal')
    })
  })

  test('should only scale width when applying spacing', () => {
    // 应用间距调整
    const adjustedSchema = adjustSchemaForSpacing({ schema: slantedStack, spacing: 2 })

    // 验证宽度被缩放但高度保持不变
    adjustedSchema.elements.forEach((element, index) => {
      // 宽度应该被缩放（小于原始宽度）
      expect(element.width).not.toBe(slantedStack.elements[index].width)
      // 高度应该保持不变
      expect(element.height).toBe(slantedStack.elements[index].height)
    })
  })
})
