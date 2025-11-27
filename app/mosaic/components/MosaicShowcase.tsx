'use client'

import { useEffect, useState } from 'react'

import { Showcase } from '@/app/mosaic/components/Showcase'
import { fetchSchemas } from '@/app/mosaic/schema'
import type { LayoutSchema, MediaObject } from '@/app/mosaic/types'

export function MosaicShowcase() {
  const [showcaseItems, setShowcaseItems] = useState<Array<{ schema: LayoutSchema; mediaItems: MediaObject[] }>>([])

  useEffect(() => {
    const loadSchemas = async () => {
      const schemas = await fetchSchemas()

      // 为不同的布局准备不同的媒体项
      const items = [
        {
          schema: schemas.grid,
          mediaItems: [
            { type: 'image', src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&h=300&fit=crop' },
            { type: 'image', src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop' },
            { type: 'image', src: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=300&fit=crop' },

            { type: 'image', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop' },
            { type: 'image', src: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300&h=300&fit=crop' },
            { type: 'image', src: 'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?w=300&h=300&fit=crop' },

            { type: 'image', src: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=300&h=300&fit=crop' },
            { type: 'image', src: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=300&h=300&fit=crop' },
            { type: 'image', src: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=300&h=300&fit=crop' },
          ] satisfies MediaObject[],
        },
        {
          schema: schemas.horizontalStack,
          mediaItems: [
            { type: 'image', src: '/showcase/horizontal-01.webp' },
            { type: 'image', src: '/showcase/horizontal-02.webp' },
            { type: 'image', src: '/showcase/horizontal-03.webp' },
          ] satisfies MediaObject[],
        },
        {
          schema: schemas.verticalStack,
          mediaItems: [
            { type: 'image', src: '/showcase/vertical-01.webp' },
            { type: 'image', src: '/showcase/vertical-02.webp' },
            { type: 'image', src: '/showcase/vertical-03.webp' },
          ] satisfies MediaObject[],
        },
        {
          schema: schemas.slantedStack,
          mediaItems: [
            { type: 'image', src: '/showcase/slanted-01.webp' },
            { type: 'image', src: '/showcase/slanted-02.webp' },
            { type: 'image', src: '/showcase/slanted-03.webp' },
          ] satisfies MediaObject[],
        },
        {
          schema: schemas.parallelogram,
          mediaItems: [
            { type: 'image', src: '/showcase/parallelogram-01.webp' },
            { type: 'image', src: '/showcase/parallelogram-03.webp' },
            { type: 'image', src: '/showcase/parallelogram-02.webp' },
          ] satisfies MediaObject[],
        },
      ]

      setShowcaseItems(items)
    }

    loadSchemas()
  }, [])

  return <Showcase items={showcaseItems} interval={3000} transitionDuration={800} canvasWidth={400} canvasHeight={400} />
}
