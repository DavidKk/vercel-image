import { adjustSchemaForSpacing } from '@/app/mosaic/services/layout/spacing'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('adjustSchemaForSpacing', () => {
  it('should return original schema when spacing is 0', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [
        {
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          fit: 'cover',
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema, spacing: 0 })

    // Should be equal in value
    expect(result).toEqual(schema)

    // Should not be the same reference
    expect(result).not.toBe(schema)
    expect(result!.elements).not.toBe(schema.elements)
  })

  it('should use schema default spacing when not provided', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      spacing: 5, // 5% spacing
      elements: [
        {
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          fit: 'cover',
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema })

    // Should adjust elements based on schema.spacing
    expect(result!.elements[0].width).toBe('95%')
    expect(result!.elements[0].height).toBe('95%')
  })

  it('should override schema default spacing when provided', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      spacing: 5, // 5% spacing
      elements: [
        {
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          fit: 'cover',
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema, spacing: 10 }) // Override with 10% spacing

    // Should adjust elements based on provided spacing, not schema.spacing
    expect(result!.elements[0].width).toBe('90%')
    expect(result!.elements[0].height).toBe('90%')
  })

  it('should handle multiple elements', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      spacing: 10,
      elements: [
        {
          x: '0%',
          y: '0%',
          width: '50%',
          height: '100%',
          fit: 'cover',
        },
        {
          x: '50%',
          y: '0%',
          width: '50%',
          height: '100%',
          fit: 'cover',
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema })

    // Both elements should be adjusted
    expect(result!.elements[0].width).toBe('45%')
    expect(result!.elements[0].height).toBe('90%')
    expect(result!.elements[1].width).toBe('45%')
    expect(result!.elements[1].height).toBe('90%')
  })

  it('should return undefined when schema is undefined', () => {
    const result = adjustSchemaForSpacing({ schema: undefined as any })
    expect(result).toBeUndefined()
  })

  it('should handle elements with different spacing directions', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      spacing: 10,
      elements: [
        {
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          fit: 'cover',
          spacingDirection: 'horizontal',
        },
        {
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          fit: 'cover',
          spacingDirection: 'vertical',
        },
      ],
    }

    const result = adjustSchemaForSpacing({ schema })

    // First element should only adjust horizontally
    expect(result!.elements[0].width).toBe('90%')
    expect(result!.elements[0].height).toBe('100%')

    // Second element should only adjust vertically
    expect(result!.elements[1].width).toBe('100%')
    expect(result!.elements[1].height).toBe('90%')
  })
})
