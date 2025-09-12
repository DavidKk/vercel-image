import { cloneSchema } from '@/app/mosaic/services/layout/utils'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('cloneSchema', () => {
  it('should create a deep copy of the schema', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      spacing: 4,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '50%',
          height: '50%',
          zIndex: 1,
          fit: 'cover',
          origin: { x: '50%', y: '50%' },
          spacingDirection: 'both',
        },
      ],
    }

    const clonedSchema = cloneSchema(originalSchema)

    // Should be equal in value
    expect(clonedSchema).toEqual(originalSchema)

    // Should not be the same reference
    expect(clonedSchema).not.toBe(originalSchema)

    // Elements should not be the same reference
    expect(clonedSchema.elements).not.toBe(originalSchema.elements)
    expect(clonedSchema.elements[0]).not.toBe(originalSchema.elements[0])
  })

  it('should handle empty elements array', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      spacing: 0,
      elements: [],
    }

    const clonedSchema = cloneSchema(originalSchema)

    expect(clonedSchema).toEqual(originalSchema)
    expect(clonedSchema.elements).not.toBe(originalSchema.elements)
  })

  it('should handle complex nested objects', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      spacing: 5,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          zIndex: 1,
          fit: 'cover',
          origin: { x: '50%', y: '50%' },
          spacingDirection: 'both',
          shadow: {
            x: 10,
            y: 10,
            blur: 5,
            color: '#000000',
          },
          mask: {
            type: 'shape',
            shape: 'circle',
          },
        },
      ],
    }

    const clonedSchema = cloneSchema(originalSchema)

    expect(clonedSchema).toEqual(originalSchema)
    expect(clonedSchema.elements[0].shadow).not.toBe(originalSchema.elements[0].shadow)
    expect(clonedSchema.elements[0].mask).not.toBe(originalSchema.elements[0].mask)
  })
})
