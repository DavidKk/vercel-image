import { formatBytes, B, KB, MB, GB, TB } from '@/utils/size'

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('should format kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(1023999)).toBe('999.9 KB')
  })

  it('should format megabytes correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
    expect(formatBytes(1024 * 1024 * 1023)).toBe('1023.0 MB')
  })

  it('should format gigabytes correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB')
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB')
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.0 GB')
  })

  it('should format terabytes correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
    expect(formatBytes(1.5 * 1024 * 1024 * 1024 * 1024)).toBe('1.5 TB')
    expect(formatBytes(2 * 1024 * 1024 * 1024 * 1024)).toBe('2.0 TB')
  })

  it('should use constants correctly', () => {
    expect(B).toBe(1)
    expect(KB).toBe(1024)
    expect(MB).toBe(1024 * 1024)
    expect(GB).toBe(1024 * 1024 * 1024)
    expect(TB).toBe(1024 * 1024 * 1024 * 1024)
  })
})
