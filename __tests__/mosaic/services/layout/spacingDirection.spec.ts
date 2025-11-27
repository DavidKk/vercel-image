import { adjustElementForSpacing, adjustSchemaForSpacing } from '@/app/mosaic/services/layout/spacing'
import type { ImageElement, LayoutSchema } from '@/app/mosaic/types'

describe('adjustSchemaForSpacing with element spacingDirection', () => {
  test('should scale both dimensions when element spacingDirection is both (default)', () => {
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
          spacingDirection: 'both', // 显式设置为 both
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, scale factor should be 0.9
    expect(element.width).toBe('90%')
    expect(element.height).toBe('90%')

    // Element should be centered (default origin 50% 50%)
    expect(element.x).toBe('5%')
    expect(element.y).toBe('5%')
  })

  test('should scale only horizontal dimension when element spacingDirection is horizontal', () => {
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
          spacingDirection: 'horizontal',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, width should be scaled to 90%, height should remain 100%
    expect(element.width).toBe('90%')
    expect(element.height).toBe('100%')

    // Only x position should change (to center the scaled element), y should remain 0%
    expect(element.x).toBe('5%')
    expect(element.y).toBe('0%')
  })

  test('should scale only vertical dimension when element spacingDirection is vertical', () => {
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
          spacingDirection: 'vertical',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, height should be scaled to 90%, width should remain 100%
    expect(element.width).toBe('100%')
    expect(element.height).toBe('90%')

    // Only y position should change (to center the scaled element), x should remain 0%
    expect(element.x).toBe('0%')
    expect(element.y).toBe('5%')
  })

  test('should use default both direction when element spacingDirection is not set', () => {
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
          // 不设置 spacingDirection，应该默认为 'both'
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, scale factor should be 0.9 for both dimensions
    expect(element.width).toBe('90%')
    expect(element.height).toBe('90%')

    // Element should be centered
    expect(element.x).toBe('5%')
    expect(element.y).toBe('5%')
  })

  test('should not modify schema when spacing is 0, regardless of element spacingDirection', () => {
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
          spacingDirection: 'horizontal',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 0 })
    expect(result).toEqual(originalSchema)
  })

  test('should handle custom origin with horizontal spacingDirection', () => {
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
          spacingDirection: 'horizontal',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, width should be scaled to 90%, height should remain 100%
    expect(element.width).toBe('90%')
    expect(element.height).toBe('100%')

    // With top-left origin, x position should remain at 0%, y should remain 0%
    expect(element.x).toBe('0%')
    expect(element.y).toBe('0%')
  })

  test('should handle custom origin with vertical spacingDirection', () => {
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
          spacingDirection: 'vertical',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, height should be scaled to 90%, width should remain 100%
    expect(element.width).toBe('100%')
    expect(element.height).toBe('90%')

    // With top-left origin, y position should remain at 0%, x should remain 0%
    expect(element.x).toBe('0%')
    expect(element.y).toBe('0%')
  })

  test('should handle mixed spacingDirection in different elements', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '50%',
          height: '100%',
          origin: { x: '50%', y: '50%' },
          spacingDirection: 'horizontal',
        } as ImageElement,
        {
          id: '2',
          x: '50%',
          y: '0%',
          width: '50%',
          height: '100%',
          origin: { x: '50%', y: '50%' },
          spacingDirection: 'vertical',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })

    // First element (horizontal spacingDirection)
    const element1 = result.elements[0]
    expect(element1.width).toBe('45%') // 50% * 0.9
    expect(element1.height).toBe('100%') // unchanged
    expect(element1.x).toBe('2.5%') // 0% + (50% - 45%) / 2
    expect(element1.y).toBe('0%') // unchanged

    // Second element (vertical spacingDirection)
    const element2 = result.elements[1]
    expect(element2.width).toBe('50%') // unchanged
    expect(element2.height).toBe('90%') // 100% * 0.9
    expect(element2.x).toBe('50%') // unchanged
    expect(element2.y).toBe('5%') // 0% + (100% - 90%) / 2
  })

  test('should handle pixel values in elements', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: 0,
          y: 0,
          width: 300,
          height: 300,
          origin: { x: '50%', y: '50%' },
          spacingDirection: 'both',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, scale factor should be 0.9
    // For pixel values, the function scales them directly and keeps them as numbers with % suffix
    expect(element.width).toBe('270%') // 300 * 0.9 = 270, with % suffix
    expect(element.height).toBe('270%') // 300 * 0.9 = 270, with % suffix

    // Element should be centered
    expect(element.x).toBe('15%') // (300-270)/2 = 15, with % suffix
    expect(element.y).toBe('15%') // (300-270)/2 = 15, with % suffix
  })

  test('should handle mixed percentage and pixel values', () => {
    const originalSchema: LayoutSchema = {
      canvasWidth: 600,
      canvasHeight: 600,
      elements: [
        {
          id: '1',
          x: '10%',
          y: 20,
          width: '80%',
          height: 300,
          origin: { x: '50%', y: '50%' },
          spacingDirection: 'both',
        } as ImageElement,
      ],
    } as LayoutSchema

    const result = adjustSchemaForSpacing({ schema: originalSchema, spacing: 10 })
    const element = result.elements[0]

    // With 10% spacing, scale factor should be 0.9
    expect(element.width).toBe('72%') // 80% * 0.9 = 72%
    expect(element.height).toBe('270%') // 300 * 0.9 = 270, with % suffix

    // Element should be centered
    expect(element.x).toBe('14%') // 10% + (80% - 72%) / 2 = 10% + 4% = 14%
    expect(element.y).toBe('35%') // 20 + (300-270)/2 = 20 + 15 = 35, with % suffix
  })
})

describe('adjustElementForSpacing', () => {
  test('should scale element with both spacingDirection', () => {
    const originalElement: ImageElement = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      origin: { x: '50%', y: '50%' },
      spacingDirection: 'both',
    } as ImageElement

    const result = adjustElementForSpacing({ element: originalElement, scaleFactor: 0.9 }) // 0.9 是 10% 间距的缩放因子

    expect(result.width).toBe('90%')
    expect(result.height).toBe('90%')
    expect(result.x).toBe('5%')
    expect(result.y).toBe('5%')
  })

  test('should scale element with horizontal spacingDirection', () => {
    const originalElement: ImageElement = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      origin: { x: '50%', y: '50%' },
      spacingDirection: 'horizontal',
    } as ImageElement

    const result = adjustElementForSpacing({ element: originalElement, scaleFactor: 0.9 })

    expect(result.width).toBe('90%')
    expect(result.height).toBe('100%')
    expect(result.x).toBe('5%')
    expect(result.y).toBe('0%')
  })

  test('should scale element with vertical spacingDirection', () => {
    const originalElement: ImageElement = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      origin: { x: '50%', y: '50%' },
      spacingDirection: 'vertical',
    } as ImageElement

    const result = adjustElementForSpacing({ element: originalElement, scaleFactor: 0.9 })

    expect(result.width).toBe('100%')
    expect(result.height).toBe('90%')
    expect(result.x).toBe('0%')
    expect(result.y).toBe('5%')
  })

  test('should handle custom origin', () => {
    const originalElement: ImageElement = {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      origin: { x: '0%', y: '0%' }, // Top-left origin
      spacingDirection: 'both',
    } as ImageElement

    const result = adjustElementForSpacing({ element: originalElement, scaleFactor: 0.9 })

    expect(result.width).toBe('90%')
    expect(result.height).toBe('90%')
    expect(result.x).toBe('0%')
    expect(result.y).toBe('0%')
  })
})
