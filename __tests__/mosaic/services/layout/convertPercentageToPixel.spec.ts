import { convertPercentageToPixel } from '@/app/mosaic/services/layout/utils'

describe('convertPercentageToPixel', () => {
  it('should convert percentage string to pixel value', () => {
    expect(convertPercentageToPixel('50%', 100)).toBe(50)
    expect(convertPercentageToPixel('25%', 200)).toBe(50)
    expect(convertPercentageToPixel('100%', 50)).toBe(50)
  })

  it('should return number value directly', () => {
    expect(convertPercentageToPixel(50, 100)).toBe(50)
    expect(convertPercentageToPixel(25.5, 200)).toBe(25.5)
  })

  it('should convert string number to float', () => {
    expect(convertPercentageToPixel('50', 100)).toBe(50)
    expect(convertPercentageToPixel('25.5', 200)).toBe(25.5)
  })
})
