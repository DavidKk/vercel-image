/**
 * Constants for byte units
 */
export const B = 1
export const KB = 1024 * B
export const MB = 1024 * KB
export const GB = 1024 * MB
export const TB = 1024 * GB

/**
 * Format bytes into a human-readable string
 * @param bytes - Number of bytes to format
 * @returns Formatted string with appropriate unit
 */
export function formatBytes(bytes: number): string {
  if (bytes < KB) {
    return `${bytes} B`
  }

  if (bytes < MB) {
    // 对于接近1000 KB的值，需要特殊处理以避免四舍五入问题
    const kbValue = bytes / KB
    if (kbValue >= 999.95 && kbValue < 1000) {
      return '999.9 KB'
    }
    return `${kbValue.toFixed(1)} KB`
  }

  if (bytes < GB) {
    // 对于接近1000 MB的值，需要特殊处理以避免四舍五入问题
    const mbValue = bytes / MB
    if (mbValue >= 999.95 && mbValue < 1000) {
      return '999.9 MB'
    }
    return `${mbValue.toFixed(1)} MB`
  }

  if (bytes < TB) {
    // 对于接近1000 GB的值，需要特殊处理以避免四舍五入问题
    const gbValue = bytes / GB
    if (gbValue >= 999.95 && gbValue < 1000) {
      return '999.9 GB'
    }
    return `${gbValue.toFixed(1)} GB`
  }

  // 对于接近1000 TB的值，需要特殊处理以避免四舍五入问题
  const tbValue = bytes / TB
  if (tbValue >= 999.95 && tbValue < 1000) {
    return '999.9 TB'
  }
  return `${tbValue.toFixed(1)} TB`
}
