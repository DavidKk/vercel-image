import { fetchSchema } from '@/app/mosaic/schema'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('Schema spacingDirection defaults', () => {
  test('grid schema should have correct spacingDirection values', async () => {
    const schema = (await fetchSchema('grid')) as LayoutSchema

    expect(schema).toBeDefined()
    expect(schema.elements).toHaveLength(9)

    // 所有元素都没有显式设置 spacingDirection，应该使用默认值 'both'
    schema.elements.forEach((element) => {
      expect(element.spacingDirection).toBe('both')
    })
  })

  test('horizontalStack schema should have all elements with horizontal spacingDirection', async () => {
    const schema = (await fetchSchema('horizontalStack')) as LayoutSchema

    expect(schema).toBeDefined()
    expect(schema.elements).toHaveLength(3)

    // 所有元素都应该有 horizontal spacingDirection
    schema.elements.forEach((element) => {
      expect(element.spacingDirection).toBe('horizontal')
    })
  })

  test('verticalStack schema should have all elements with vertical spacingDirection', async () => {
    const schema = (await fetchSchema('verticalStack')) as LayoutSchema

    expect(schema).toBeDefined()
    expect(schema.elements).toHaveLength(3)

    // 所有元素都应该有 vertical spacingDirection
    schema.elements.forEach((element) => {
      expect(element.spacingDirection).toBe('vertical')
    })
  })
})
