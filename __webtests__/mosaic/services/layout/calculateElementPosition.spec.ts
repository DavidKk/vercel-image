import { calculateElementPosition } from '@/app/mosaic/services/layout/position'
import type { ImageElement } from '@/app/mosaic/types'

describe('calculateElementPosition', () => {
  it('should calculate position with percentage values', () => {
    const element: ImageElement = {
      x: '25%',
      y: '25%',
      width: '50%',
      height: '50%',
      fit: 'cover',
    }

    const result = calculateElementPosition(element, 100, 100)

    expect(result.x).toBe(25)
    expect(result.y).toBe(25)
    expect(result.width).toBe(50)
    expect(result.height).toBe(50)
  })

  it('should calculate position with pixel values', () => {
    const element: ImageElement = {
      x: 10,
      y: 20,
      width: 50,
      height: 60,
      fit: 'cover',
    }

    const result = calculateElementPosition(element, 100, 100)

    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(50)
    expect(result.height).toBe(60)
  })

  it('should handle mixed percentage and pixel values', () => {
    const element: ImageElement = {
      x: '10%',
      y: 20,
      width: '50%',
      height: 60,
      fit: 'cover',
    }

    const result = calculateElementPosition(element, 100, 100)

    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(50)
    expect(result.height).toBe(60)
  })
})
