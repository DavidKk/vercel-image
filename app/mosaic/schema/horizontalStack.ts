import type { LayoutSchema } from '@/app/mosaic/types'

/** 三张横向堆叠 */
export const horizontalStack: LayoutSchema = {
  canvasWidth: 600,
  canvasHeight: 600,
  spacing: 2,
  padding: 2,
  spacingRange: [0, 10],
  paddingRange: [0, 10],
  elements: [
    {
      id: '1',
      x: '0%',
      y: '0%',
      width: '33.333%',
      height: '100%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '0', y: '50%' },
      spacingDirection: 'horizontal',
    },
    {
      id: '2',
      x: '33.333%',
      y: '0%',
      width: '33.333%',
      height: '100%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '50%', y: '50%' },
      spacingDirection: 'horizontal',
    },
    {
      id: '3',
      x: '66.666%',
      y: '0%',
      width: '33.334%',
      height: '100%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '100%', y: '50%' },
      spacingDirection: 'horizontal',
    },
  ],
}
