import type { LayoutSchema } from '@/app/mosaic/types'

/** 拼贴布局（四张图片不规则排列） */
export const collage: LayoutSchema = {
  canvasWidth: 600,
  canvasHeight: 600,
  spacing: 1,
  padding: 1,
  spacingRange: [0, 10],
  paddingRange: [0, 10],
  elements: [
    // 左上角大图
    {
      id: '1',
      x: '0%',
      y: '0%',
      width: '60%',
      height: '60%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '0%', y: '0%' },
      spacingDirection: 'both',
    },
    // 右上角图
    {
      id: '2',
      x: '60%',
      y: '0%',
      width: '40%',
      height: '30%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '100%', y: '0%' },
      spacingDirection: 'both',
    },
    // 右下角图
    {
      id: '3',
      x: '60%',
      y: '30%',
      width: '40%',
      height: '70%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '100%', y: '100%' },
      spacingDirection: 'both',
    },
    // 左下角图
    {
      id: '4',
      x: '0%',
      y: '60%',
      width: '60%',
      height: '40%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '0%', y: '100%' },
      spacingDirection: 'both',
    },
  ],
}
