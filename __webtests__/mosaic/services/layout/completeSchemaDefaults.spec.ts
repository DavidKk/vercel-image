import { completeSchemaDefaults } from '@/app/mosaic/services/layout/schema'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('completeSchemaDefaults', () => {
  it('should complete defaults for elements in schema', () => {
    const schema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [
        {
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          fit: 'cover' as const,
        },
      ],
    }

    const result = completeSchemaDefaults(schema)

    // Should preserve original properties
    expect(result.canvasWidth).toBe(100)
    expect(result.canvasHeight).toBe(100)

    // Should complete defaults for elements
    expect(result.elements[0].spacingDirection).toBe('both')
    expect(result.elements[0].origin).toEqual({ x: '50%', y: '50%' })
  })

  it('should handle schema with multiple elements', () => {
    const schema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [
        {
          x: '0%',
          y: '0%',
          width: '50%',
          height: '100%',
          fit: 'cover' as const,
        },
        {
          x: '50%',
          y: '0%',
          width: '50%',
          height: '100%',
          fit: 'cover' as const,
          spacingDirection: 'horizontal' as const,
        },
      ],
    }

    const result = completeSchemaDefaults(schema)

    // First element should get default spacingDirection
    expect(result.elements[0].spacingDirection).toBe('both')
    expect(result.elements[0].origin).toEqual({ x: '50%', y: '50%' })

    // Second element should preserve existing spacingDirection
    expect(result.elements[1].spacingDirection).toBe('horizontal')
    expect(result.elements[1].origin).toEqual({ x: '50%', y: '50%' })
  })

  it('should handle schema with empty elements array', () => {
    const schema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [] as any[],
    }

    const result = completeSchemaDefaults(schema)

    expect(result.elements).toEqual([])
  })

  it('should handle schema without elements property', () => {
    const schema = {
      canvasWidth: 100,
      canvasHeight: 100,
    }

    const result = completeSchemaDefaults(schema as any)

    // Should not add elements property if it doesn't exist
    expect(result).not.toHaveProperty('elements')
  })
})
