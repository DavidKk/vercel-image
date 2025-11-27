import { convertPercentageToPixel } from '@/app/mosaic/services/layout/utils'

describe('Origin Property Tests', () => {
  test('convertPercentageToPixel should correctly convert percentage values', () => {
    expect(convertPercentageToPixel('50%', 100)).toBe(50)
    expect(convertPercentageToPixel('0%', 100)).toBe(0)
    expect(convertPercentageToPixel('100%', 100)).toBe(100)
    expect(convertPercentageToPixel('25%', 200)).toBe(50)
  })

  test('convertPercentageToPixel should correctly handle numeric values', () => {
    expect(convertPercentageToPixel(50, 100)).toBe(50)
    expect(convertPercentageToPixel(0, 100)).toBe(0)
    expect(convertPercentageToPixel(100, 100)).toBe(100)
  })
})
