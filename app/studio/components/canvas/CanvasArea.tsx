'use client'

/**
 * Zone C: canvas area switching between view modes
 */
import { PanelEmptyState } from '@/components/PanelEmptyState'
import { isPipelineSourceImage, isTextDocumentAsset } from '@/lib/studio/asset-helpers'
import { getTextDocumentBaseAsset } from '@/lib/studio/text-document'

import { useStudio } from '../../context/StudioContext'
import { AddTextPreviewView } from './AddTextPreviewView'
import { CompareView } from './CompareView'
import { DetailView } from './DetailView'
import { PreviewToolbar } from './PreviewToolbar'
import { SpriteView } from './SpriteView'

/**
 * Resolve a one-line preview empty message
 * @param loading Whether the library is still hydrating
 * @param assetCount Total assets including pending placeholders
 * @param selectedCount Number of selected asset ids
 * @returns Empty-state message
 */
function getPreviewEmptyMessage(loading: boolean, assetCount: number, selectedCount: number): string {
  if (loading) return 'Loading...'
  if (assetCount === 0) return 'Nothing to preview'
  if (selectedCount > 1) return 'Pick one asset to preview'
  return 'Select an asset to preview'
}

/**
 * Studio canvas area (Zone C)
 * @returns Canvas area element
 */
export function CanvasArea() {
  const { allAssets, loading, selectedIds, primarySelected, parentAsset, spriteAsset, viewMode, activeTab } = useStudio()

  const emptyMessage = getPreviewEmptyMessage(loading, allAssets.length, selectedIds.length)
  const addTextBaseAsset = primarySelected && isTextDocumentAsset(primarySelected) ? getTextDocumentBaseAsset(primarySelected, allAssets) : primarySelected
  const showAddTextPreview = activeTab === 'add-text' && addTextBaseAsset && primarySelected && (isPipelineSourceImage(primarySelected) || isTextDocumentAsset(primarySelected))

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--studio-workspace-bg)]">
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--studio-canvas-bg)]">
        {showAddTextPreview && addTextBaseAsset ? (
          <AddTextPreviewView asset={addTextBaseAsset} />
        ) : viewMode === 'detail' && primarySelected ? (
          <DetailView asset={primarySelected} />
        ) : viewMode === 'compare' && primarySelected && parentAsset ? (
          <CompareView asset={primarySelected} parent={parentAsset} />
        ) : viewMode === 'sprite' && spriteAsset ? (
          <SpriteView asset={spriteAsset} />
        ) : (
          <PanelEmptyState message={emptyMessage} loading={loading} />
        )}
      </main>

      {!loading && allAssets.length > 0 ? <PreviewToolbar /> : null}
    </div>
  )
}
