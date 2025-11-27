import { adjustSchemaForSpacing } from '@/app/mosaic/services/layout'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('adjustSchemaForSpacing', () => {
  test('should return original schema when schema is null', () => {
    const result = adjustSchemaForSpacing({ schema: null as any, spacing: 5 })
    expect(result).toBeNull()
  })

  test('should return original schema when schema is undefined', () => {
    const result = adjustSchemaForSpacing({ schema: undefined as any, spacing: 5 })
    expect(result).toBeUndefined()
  })

  test('should not modify schema when spacing is 0', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '50%',
          height: '50%',
          origin: { x: '50%', y: '50%' },
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 0 })
    expect(result).toEqual(originalSchema)
  })

  test('should scale elements correctly with 10% spacing', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          origin: { x: '50%', y: '50%' },
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, scale factor should be 0.9
    expect(element.width).toBe('90%')
    expect(element.height).toBe('90%')

    // Element should be centered (default origin 50% 50%)
    expect(element.x).toBe('5%')
    expect(element.y).toBe('5%')
  })

  test('should scale elements correctly with custom origin', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          origin: { x: '0%', y: '0%' }, // Top-left origin
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, scale factor should be 0.9
    expect(element.width).toBe('90%')
    expect(element.height).toBe('90%')

    // With top-left origin, position should remain at (0%, 0%)
    expect(element.x).toBe('0%')
    expect(element.y).toBe('0%')
  })

  test('should handle multiple elements', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '50%',
          height: '50%',
          origin: { x: '50%', y: '50%' },
        },
        {
          id: '2',
          x: '50%',
          y: '50%',
          width: '50%',
          height: '50%',
          origin: { x: '0%', y: '0%' },
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 5 })
    const element1 = result.elements[0]
    const element2 = result.elements[1]

    // With 5% spacing, scale factor should be 0.95

    // First element (centered origin)
    expect(element1.width).toBe('47.5%') // 50% * 0.95
    expect(element1.height).toBe('47.5%') // 50% * 0.95
    expect(element1.x).toBe('1.25%') // 0% + (50% - 47.5%) / 2
    expect(element1.y).toBe('1.25%') // 0% + (50% - 47.5%) / 2

    // Second element (top-left origin)
    expect(element2.width).toBe('47.5%') // 50% * 0.95
    expect(element2.height).toBe('47.5%') // 50% * 0.95
    expect(element2.x).toBe('50%') // Should remain unchanged
    expect(element2.y).toBe('50%') // Should remain unchanged
  })

  test('should preserve other element properties', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          origin: { x: '50%', y: '50%' },
          rotation: 45,
          fit: 'cover',
          backgroundColor: '#ff0000',
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // Position and size should be updated
    expect(element.width).toBe('90%')
    expect(element.height).toBe('90%')
    expect(element.x).toBe('5%')
    expect(element.y).toBe('5%')

    // Other properties should be preserved
    expect(element.rotation).toBe(45)
    expect(element.fit).toBe('cover')
    expect(element.backgroundColor).toBe('#ff0000')
  })

  test('should return a deep copy of schema when spacing is 0', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '50%',
          height: '50%',
          origin: { x: '50%', y: '50%' },
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 0 })

    // Result should be equal to original but not the same object
    expect(result).toEqual(originalSchema)
    expect(result).not.toBe(originalSchema)
    expect(result.elements[0]).not.toBe(originalSchema.elements[0])
  })
})
