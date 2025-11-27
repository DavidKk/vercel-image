import { completeElementDefaults } from '@/app/mosaic/services/layout/schema'
import type { ImageElement } from '@/app/mosaic/types'

describe('completeElementDefaults', () => {
  it('should add default spacingDirection when not provided', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
    } as ImageElement

    const result = completeElementDefaults(element)

    expect(result.spacingDirection).toBe('both')
  })

  it('should preserve existing spacingDirection', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      spacingDirection: 'horizontal',
    } as ImageElement

    const result = completeElementDefaults(element)

    expect(result.spacingDirection).toBe('horizontal')
  })

  it('should add default origin when not provided', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
    } as ImageElement

    const result = completeElementDefaults(element)

    expect(result.origin).toEqual({ x: '50%', y: '50%' })
  })

  it('should preserve existing origin', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      origin: { x: '0%', y: '0%' },
    } as ImageElement

    const result = completeElementDefaults(element)

    expect(result.origin).toEqual({ x: '0%', y: '0%' })
  })

  it('should complete missing origin coordinates', () => {
    const element: ImageElement = {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      fit: 'cover',
      origin: { x: '25%', y: '50%' }, // 确保 y 存在
    } as ImageElement

    const result = completeElementDefaults(element)

    expect(result.origin).toEqual({ x: '25%', y: '50%' })
  })

  it('should handle completely empty element', () => {
    const element = {} as ImageElement

    const result = completeElementDefaults(element)

    expect(result.spacingDirection).toBe('both')
    expect(result.origin).toEqual({ x: '50%', y: '50%' })
  })
})
