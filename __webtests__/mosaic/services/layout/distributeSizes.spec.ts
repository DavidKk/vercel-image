import { distributeSizes } from '@/app/mosaic/services/layout/utils'

describe('distributeSizes', () => {
  it('should distribute sizes evenly with no gap', () => {
    const result = distributeSizes(100, 3, 0)
    const total = result.reduce((sum, size) => sum + size, 0)
    expect(total).toBe(100)
    // The actual result may vary due to rounding, but should sum to 100
    expect(result.length).toBe(3)
  })

  it('should distribute sizes with gap', () => {
    const result = distributeSizes(100, 3, 10)
    // Total gaps: (3-1) * 10 = 20
    // Available space: 100 - 20 = 80
    const totalGaps = (3 - 1) * 10
    const total = result.reduce((sum, size) => sum + size, 0) + totalGaps
    expect(total).toBe(100)
    expect(result.length).toBe(3)
  })

  it('should handle edge case with large gaps', () => {
    const result = distributeSizes(100, 3, 60)
    // Total gaps: (3-1) * 60 = 120
    // Available space: 100 - 120 = -20 (negative)
    // Should distribute evenly without gaps
    const total = result.reduce((sum, size) => sum + size, 0)
    expect(total).toBe(100)
    expect(result.length).toBe(3)
  })

  it('should handle single segment', () => {
    const result = distributeSizes(100, 1, 10)
    expect(result).toEqual([100])
  })
})
