import type { LayoutSchema } from '@/app/mosaic/types'

/** 九宫格布局 */
export const grid: LayoutSchema = {
  canvasWidth: 600,
  canvasHeight: 600,
  spacing: 2,
  padding: 2,
  spacingRange: [0, 10],
  paddingRange: [0, 10],
  elements: [
    // 第一行
    { id: '1', x: '0%', y: '0%', width: '33.333%', height: '33.333%', zIndex: 1, fit: 'cover', origin: { x: '0', y: '0' } },
    { id: '2', x: '33.333%', y: '0%', width: '33.333%', height: '33.333%', zIndex: 1, fit: 'cover', origin: { x: '50%', y: '0' } },
    { id: '3', x: '66.666%', y: '0%', width: '33.334%', height: '33.333%', zIndex: 1, fit: 'cover', origin: { x: '100%', y: '0' } },
    // 第二行
    { id: '4', x: '0%', y: '33.333%', width: '33.333%', height: '33.333%', zIndex: 1, fit: 'cover', origin: { x: '0', y: '50%' } },
    { id: '5', x: '33.333%', y: '33.333%', width: '33.333%', height: '33.333%', zIndex: 1, fit: 'cover', origin: { x: '50%', y: '50%' } },
    { id: '6', x: '66.666%', y: '33.333%', width: '33.334%', height: '33.333%', zIndex: 1, fit: 'cover', origin: { x: '100%', y: '50%' } },
    // 第三行
    { id: '7', x: '0%', y: '66.666%', width: '33.333%', height: '33.334%', zIndex: 1, fit: 'cover', origin: { x: '0', y: '100%' } },
    { id: '8', x: '33.333%', y: '66.666%', width: '33.333%', height: '33.334%', zIndex: 1, fit: 'cover', origin: { x: '50%', y: '100%' } },
    { id: '9', x: '66.666%', y: '66.666%', width: '33.334%', height: '33.334%', zIndex: 1, fit: 'cover', origin: { x: '100%', y: '100%' } },
  ],
}
