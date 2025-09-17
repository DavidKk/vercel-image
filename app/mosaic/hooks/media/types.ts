// 定义媒体目标类型
export interface MediaTarget {
  type: 'image' | 'video'
  node: HTMLImageElement | HTMLVideoElement
  offsetX: number
  offsetY: number
}