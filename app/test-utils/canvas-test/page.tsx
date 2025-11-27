'use client'

/**
 * Canvas 测试工具页面
 * 用于在浏览器中运行 canvas 相关的单元测试
 * 这个页面会被 Playwright 测试使用
 */
import { useEffect } from 'react'

import { drawMask, drawRoundedRectPath, drawShadow, drawShapeMask } from '@/app/mosaic/services/layout/drawing'
import { calculateElementPosition } from '@/app/mosaic/services/layout/position'
import { drawBackground } from '@/app/mosaic/services/layout/rendering/drawBackground'
import { drawMedia } from '@/app/mosaic/services/layout/rendering/drawMedia'
import { drawMediaContain } from '@/app/mosaic/services/layout/rendering/drawMediaContain'
import { drawMediaCover } from '@/app/mosaic/services/layout/rendering/drawMediaCover'
import { drawMediaFill } from '@/app/mosaic/services/layout/rendering/drawMediaFill'
import { drawPlaceholder } from '@/app/mosaic/services/layout/rendering/drawPlaceholder'
import { adjustSchemaForSpacing } from '@/app/mosaic/services/layout/spacing'
import { convertPercentageToPixel } from '@/app/mosaic/services/layout/utils'

export default function CanvasTestPage() {
  useEffect(() => {
    // 将测试函数暴露到全局，供 Playwright 使用
    ;(window as any).__testUtils = {
      drawMedia,
      drawPlaceholder,
      drawBackground,
      drawMediaContain,
      drawMediaCover,
      drawMediaFill,
      calculateElementPosition,
      convertPercentageToPixel,
      adjustSchemaForSpacing,
      drawMask,
      drawRoundedRectPath,
      drawShadow,
      drawShapeMask,
    }
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Canvas Test Utils</h1>
      <p>This page is used for Playwright canvas tests</p>
      <canvas id="test-canvas" width="800" height="600" style={{ border: '1px solid #000' }} />
    </div>
  )
}
