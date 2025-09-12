import { detectClickPosition } from '@/app/mosaic/services/layout/position'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('detectClickPosition', () => {
  it('should detect click position on single element', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          fit: 'cover',
        },
      ],
    }

    // Click in the center of the element
    const result = detectClickPosition(schema, 50, 50)
    expect(result).toBe(0)
  })

  it('should return null when click is outside all elements', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '50%',
          height: '50%',
          fit: 'cover',
        },
      ],
    }

    // Click outside the element
    const result = detectClickPosition(schema, 75, 75)
    expect(result).toBeNull()
  })

  it('should detect click position on correct element when overlapping', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '100%',
          height: '100%',
          zIndex: 1,
          fit: 'cover',
        },
        {
          id: '2',
          x: '25%',
          y: '25%',
          width: '50%',
          height: '50%',
          zIndex: 2, // Higher z-index should be detected first
          fit: 'cover',
        },
      ],
    }

    // Click in the center of the overlapping area
    const result = detectClickPosition(schema, 50, 50)
    // Should return index of element with higher z-index (element 2 at index 1)
    expect(result).toBe(1)
  })

  it('should handle elements with same z-index', () => {
    const schema: LayoutSchema = {
      canvasWidth: 100,
      canvasHeight: 100,
      elements: [
        {
          id: '1',
          x: '0%',
          y: '0%',
          width: '75%',
          height: '75%',
          fit: 'cover',
        },
        {
          id: '2',
          x: '25%',
          y: '25%',
          width: '75%',
          height: '75%',
          fit: 'cover',
        },
      ],
    }

    // Click in the overlapping area
    const result = detectClickPosition(schema, 50, 50)
    // Should return index of first element in array (element 1 at index 0)
    expect(result).toBe(0)
  })
})
