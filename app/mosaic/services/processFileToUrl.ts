import { isHeicFile, convertHeicFileToUrl } from '@/app/mosaic/services/heicConverter'

export interface ProcessFileToUrlResult {
  fileUrl: string
  mediaType: 'image' | 'video'
  revoke?: () => void
}

export async function processFileToUrl(file: File): Promise<ProcessFileToUrlResult> {
  if (typeof window !== 'undefined' && isHeicFile(file)) {
    const fileUrl = await convertHeicFileToUrl(file) // 假设返回 base64
    return { fileUrl, mediaType: 'image' }
  }

  const fileType = file.type.split('/')[0]
  const mediaType: 'image' | 'video' = fileType === 'video' ? 'video' : 'image'
  const fileUrl = URL.createObjectURL(file)

  return {
    fileUrl,
    mediaType,
    revoke: () => URL.revokeObjectURL(fileUrl),
  }
}
