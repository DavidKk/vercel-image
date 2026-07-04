import { Suspense } from 'react'

import { StudioClient } from './StudioClient'

/**
 * Studio editor page entry
 * @returns Studio page element
 */
export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioClient />
    </Suspense>
  )
}
