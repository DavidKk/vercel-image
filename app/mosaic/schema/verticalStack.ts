import type { LayoutSchema } from '@/app/mosaic/types'

/** 三张纵向堆叠 */
export const verticalStack: LayoutSchema = {
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
      width: '100%',
      height: '33.333%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '50%', y: '0' },
      spacingDirection: 'vertical',
    },
    {
      id: '2',
      x: '0%',
      y: '33.333%',
      width: '100%',
      height: '33.333%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '50%', y: '50%' },
      spacingDirection: 'vertical',
    },
    {
      id: '3',
      x: '0%',
      y: '66.666%',
      width: '100%',
      height: '33.334%',
      zIndex: 1,
      fit: 'cover',
      origin: { x: '50%', y: '100%' },
      spacingDirection: 'vertical',
    },
  ],
}
