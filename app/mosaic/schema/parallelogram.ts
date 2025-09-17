import type { LayoutSchema } from '@/app/mosaic/types'

export const parallelogram: LayoutSchema = {
  canvasWidth: 600,
  canvasHeight: 600,
  spacing: 2,
  padding: 2,
  spacingRange: [0, 10],
  paddingRange: [0, 10],
  elements: [
    // 左侧梯形
    {
      id: '1',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '0%', y: '50%' },
      spacingDirection: 'horizontal',
      mask: {
        type: 'shape',
        shape: 'polygon',
        polygonPoints: [
          { x: '0%', y: '0%' },
          { x: '33.33333%', y: '0%' },
          { x: '22.11%', y: '100%' },
          { x: '0', y: '100%' },
        ],
      },
    },
    // 中间平行四边形
    {
      id: '2',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      zIndex: 2,
      fit: 'cover',
      origin: { x: '50%', y: '50%' },
      spacingDirection: 'horizontal',
      mask: {
        type: 'shape',
        shape: 'polygon',
        polygonPoints: [
          { x: '33.33%', y: '0%' },
          { x: 100 - 22.11 + '%', y: '0%' },
          { x: 100 - 33.33 + '%', y: '100%' },
          { x: '22.11%', y: '100%' },
        ],
      },
    },
    // 右侧梯形
    {
      id: '3',
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '100%', y: '50%' },
      spacingDirection: 'horizontal',
      mask: {
        type: 'shape',
        shape: 'polygon',
        polygonPoints: [
          { x: 100 - 22.11 + '%', y: '0%' },
          { x: '100%', y: '0%' },
          { x: '100%', y: '100%' },
          { x: 100 - 33.3333 + '%', y: '100%' },
        ],
      },
    },
  ],
}
