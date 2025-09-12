/**
 * 检查文件是否为 HEIC 格式
 * @param file 要检查的文件
 * @returns 如果是 HEIC 格式返回 true，否则返回 false
 */
export function isHeicFile(file: File): boolean {
  // 确保在浏览器环境中运行
  if (typeof window === 'undefined') {
    return false
  }

  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()

  // 检查文件扩展名
  if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
    return true
  }

  // 检查 MIME 类型
  if (fileType === 'image/heic' || fileType === 'image/heif') {
    return true
  }

  return false
}

/**
 * 将 HEIC 文件转换为 JPEG 格式
 * @param file HEIC 文件
 * @returns 转换后的 Blob 对象
 */
export async function convertHeicToJpeg(file: File): Promise<Blob> {
  // 确保在浏览器环境中运行
  if (typeof window === 'undefined') {
    throw new Error('HEIC 转换只能在浏览器环境中进行')
  }

  // 动态导入 heic2any 以避免在服务器端加载
  const { default: heic2any } = await import('heic2any')

  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92, // JPEG 质量
    })

    // heic2any 可能返回单个 Blob 或 Blob 数组
    if (Array.isArray(result)) {
      return result[0]
    }

    return result as Blob
  } catch (error) {
    throw new Error(`HEIC 转换失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 将 HEIC 文件转换为可使用的 URL
 * @param file HEIC 文件
 * @returns 转换后的 JPEG 文件的 URL
 */
export async function convertHeicFileToUrl(file: File): Promise<string> {
  // 确保在浏览器环境中运行
  if (typeof window === 'undefined') {
    throw new Error('HEIC 转换只能在浏览器环境中进行')
  }

  const jpegBlob = await convertHeicToJpeg(file)
  return URL.createObjectURL(jpegBlob)
}
