import { adjustElementForSpacing } from '@/app/mosaic/services/layout/spacing'
import type { ImageElement } from '@/app/mosaic/types'

describe('adjustElementForSpacing', () => {
  it('should adjust element size and position for both directions', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
    }

    const result = adjustElementForSpacing({ element, scaleFactor: 0.9 }) // 10% spacing

    // Should shrink element size
    expect(result.width).toBe('90%')
    expect(result.height).toBe('90%')

    // Should adjust position to keep center fixed
    expect(result.x).toBe('5%')
    expect(result.y).toBe('5%')
  })

  it('should adjust element size and position for horizontal direction only', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      spacingDirection: 'horizontal',
    }

    const result = adjustElementForSpacing({ element, scaleFactor: 0.9 }) // 10% spacing

    // Should shrink width only
    expect(result.width).toBe('90%')
    expect(result.height).toBe('100%')

    // Should adjust x position only
    expect(result.x).toBe('5%')
    expect(result.y).toBe('0%')
  })

  it('should adjust element size and position for vertical direction only', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      spacingDirection: 'vertical',
    }

    const result = adjustElementForSpacing({ element, scaleFactor: 0.9 }) // 10% spacing

    // Should shrink height only
    expect(result.width).toBe('100%')
    expect(result.height).toBe('90%')

    // Should adjust y position only
    expect(result.x).toBe('0%')
    expect(result.y).toBe('5%')
  })

  it('should use custom origin point', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      origin: { x: '0%', y: '0%' }, // Top-left origin
    }

    const result = adjustElementForSpacing({ element, scaleFactor: 0.9 }) // 10% spacing

    // Should shrink element size
    expect(result.width).toBe('90%')
    expect(result.height).toBe('90%')

    // Should keep top-left corner fixed (no position change)
    expect(result.x).toBe('0%')
    expect(result.y).toBe('0%')
  })

  it('should preserve other element properties', () => {
    const element: ImageElement = {
      id: 'test',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      rotation: 45,
      opacity: 0.5,
      backgroundColor: '#ff0000',
    }

    const result = adjustElementForSpacing({ element, scaleFactor: 0.9 })

    // Should preserve non-position/size properties
    expect(result.id).toBe('test')
    expect(result.fit).toBe('cover')
    expect(result.rotation).toBe(45)
    expect(result.opacity).toBe(0.5)
    expect(result.backgroundColor).toBe('#ff0000')
  })
})
