/**
 * 获取单个视频的元数据
 * @param url 视频 URL
 * @returns 包含视频元数据的 Promise
 */
export function getVideoMetadata(url: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true // 静音处理，避免播放问题

    video.onloadedmetadata = () => {
      resolve({ duration: video.duration })
    }

    video.onerror = () => {
      reject(new Error(`Failed to load video metadata from ${url}`))
    }

    video.src = url
  })
}

/**
 * 获取 URLs 中最长的视频时长
 * @param urls 视频 URL 数组
 * @returns 最长的视频时长（秒），如果没有视频则返回默认值15秒
 */
export function getLongestVideoDuration(urls: string[]): Promise<number> {
  if (urls.length === 0) {
    return Promise.resolve(15) // 默认时长
  }

  return new Promise(async (resolve) => {
    try {
      // 并行获取所有视频的元数据
      const metadataPromises = urls.map((url) => getVideoMetadata(url))
      const metadataList = await Promise.all(metadataPromises)

      // 获取所有视频时长并找出最大值
      const durations = metadataList.map((metadata) => metadata.duration)
      const maxDuration = Math.max(...durations)

      resolve(maxDuration > 0 ? maxDuration : 15)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting video durations:', error)
      resolve(15) // 出错时返回默认时长
    }
  })
}
