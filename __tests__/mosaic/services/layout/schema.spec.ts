import { completeElementDefaults, completeSchemaDefaults } from '@/app/mosaic/services/layout/schema'
import type { ImageElement, LayoutSchema } from '@/app/mosaic/types'

describe('completeElementDefaults', () => {
  test('should add default spacingDirection when not provided', () => {
    const element: Partial<ImageElement> = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
    }

    const result = completeElementDefaults(element)

    expect(result.spacingDirection).toBe('both')
  })

  test('should preserve existing spacingDirection when provided', () => {
    const element: Partial<ImageElement> = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      spacingDirection: 'horizontal',
    }

    const result = completeElementDefaults(element)

    expect(result.spacingDirection).toBe('horizontal')
  })

  test('should add default origin when not provided', () => {
    const element: Partial<ImageElement> = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
    }

    const result = completeElementDefaults(element)

    expect(result.origin).toEqual({ x: '50%', y: '50%' })
  })

  test('should preserve existing origin when provided', () => {
    const element: Partial<ImageElement> = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      origin: { x: '0%', y: '0%' },
    }

    const result = completeElementDefaults(element)

    expect(result.origin).toEqual({ x: '0%', y: '0%' })
  })

  test('should preserve all other properties', () => {
    const element: Partial<ImageElement> = {
      id: '1',
      x: '10%',
      y: '20%',
      width: '80%',
      height: '60%',
      rotation: 45,
      zIndex: 2,
      fit: 'cover',
      backgroundColor: '#ff0000',
    }

    const result = completeElementDefaults(element)

    expect(result.id).toBe('1')
    expect(result.x).toBe('10%')
    expect(result.y).toBe('20%')
    expect(result.width).toBe('80%')
    expect(result.height).toBe('60%')
    expect(result.rotation).toBe(45)
    expect(result.zIndex).toBe(2)
    expect(result.fit).toBe('cover')
    expect(result.backgroundColor).toBe('#ff0000')
    expect(result.spacingDirection).toBe('both')
    expect(result.origin).toEqual({ x: '50%', y: '50%' })
  })
})

describe('completeSchemaDefaults', () => {
  test('should complete defaults for all elements in schema', () => {
    const schema: Partial<LayoutSchema> = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
        },
        {
          id: '2',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          spacingDirection: 'horizontal',
        },
      ],
    }

    const result = completeSchemaDefaults(schema)

    // First element should have default values
    expect(result.elements[0].spacingDirection).toBe('both')
    expect(result.elements[0].origin).toEqual({ x: '50%', y: '50%' })

    // Second element should preserve its spacingDirection but get default origin
    expect(result.elements[1].spacingDirection).toBe('horizontal')
    expect(result.elements[1].origin).toEqual({ x: '50%', y: '50%' })
  })

  test('should preserve all other schema properties', () => {
    const schema: Partial<LayoutSchema> = {
      canvasWidth: 800,
      canvasHeight: 600,
      elements: [],
    }

    const result = completeSchemaDefaults(schema)

    expect(result.canvasWidth).toBe(800)
    expect(result.canvasHeight).toBe(600)
    expect(result.elements).toEqual([])
  })
})
