'use client'

import { useEffect, useState } from 'react'
import { Showcase } from '@/app/mosaic/components/Showcase'
import { fetchSchemas } from '@/app/mosaic/schema'
import type { MediaObject, LayoutSchema } from '@/app/mosaic/types'

// 示例媒体数据
const sampleMediaItems: MediaObject[] = [
  { type: 'image', src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=300&h=300&fit=crop' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=300&h=300&fit=crop' },
]

export default function ShowcasePage() {
  const [showcaseItems, setShowcaseItems] = useState<Array<{ schema: LayoutSchema; mediaItems: MediaObject[] }>>([])

  useEffect(() => {
    const loadSchemas = async () => {
      const schemas = await fetchSchemas()

      // 为不同的布局准备不同的媒体项
      const items = [
        {
          schema: schemas.grid,
          mediaItems: sampleMediaItems.slice(0, 9),
        },
        {
          schema: schemas.horizontalStack,
          mediaItems: sampleMediaItems.slice(0, 3),
        },
        {
          schema: schemas.verticalStack,
          mediaItems: sampleMediaItems.slice(0, 3),
        },
        {
          schema: schemas.slantedStack,
          mediaItems: sampleMediaItems.slice(0, 3),
        },
        {
          schema: schemas.parallelogram,
          mediaItems: sampleMediaItems.slice(0, 4),
        },
      ]

      setShowcaseItems(items)
    }

    loadSchemas()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Showcase items={showcaseItems} interval={3000} transitionDuration={800} />
      </div>
    </div>
  )
}
