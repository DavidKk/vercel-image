'use client'

/**
 * Zone B: asset library with left icon rail filters, album grid, and custom scroll
 */
import { type ComponentType, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiImage, FiVideo } from 'react-icons/fi'
import { MdAutoFixHigh, MdChecklist, MdDeselect, MdGif, MdSelectAll, MdViewModule } from 'react-icons/md'

import { useConfirm } from '@/components/confirm-dialog'
import { PanelEmptyState } from '@/components/PanelEmptyState'
import { ScrollArea } from '@/components/ScrollArea'
import { Tooltip } from '@/components/Tooltip'
import { isPendingAsset } from '@/lib/studio/pending-asset'
import { isTextDocumentAsset } from '@/lib/studio/text-document'

import { useStudio } from '../../context/StudioContext'
import { getLibrarySidebarFilter, type LibraryKindFilter, type LibrarySidebarFilter, parseLibrarySidebarFilter } from '../../hooks/studio-url-query'
import { useStudioFileImport } from '../../hooks/useStudioFileImport'
import { StudioIconSegmentRail } from '../primitives/StudioSegmentedControl'
import { StudioPanel, StudioPanelBody, StudioPanelHeader, StudioPanelIconButton } from '../StudioPanel'
import { AssetCard, type LibraryReorderStartContext } from './AssetCard'
import { getLibraryImportConfig } from './library-import'
import { autoScrollLibraryDrag, computeLibraryDisplayIndices, measureLibraryGridCellSize, resolveLibraryHoverIndex } from './library-reorder-layout'

/** Sidebar filter entry with icon */
interface SidebarFilterItem {
  /** Sidebar filter id */
  value: LibrarySidebarFilter
  /** Tooltip and aria label */
  label: string
  /** Icon component */
  Icon: ComponentType<{ className?: string }>
}

/** Left-rail library filters (original/generated images share the image kind) */
const SIDEBAR_FILTERS: SidebarFilterItem[] = [
  { value: 'original', label: 'Original images', Icon: FiImage },
  { value: 'generated', label: 'Generated images', Icon: MdAutoFixHigh },
  { value: 'video', label: 'Videos', Icon: FiVideo },
  { value: 'gif', label: 'GIF', Icon: MdGif },
  { value: 'sprite', label: 'Sprite sheets', Icon: MdViewModule },
]

/** Active library reorder drag state */
interface LibraryDragState {
  /** Dragged asset id */
  id: string
  /** Original index in the filtered list */
  sourceIndex: number
  /** Current hover insertion index */
  hoverIndex: number
  /** Pointer position in viewport coordinates */
  pointerX: number
  /** Pointer position in viewport coordinates */
  pointerY: number
  /** Pointer offset from the card's left edge */
  offsetX: number
  /** Pointer offset from the card's top edge */
  offsetY: number
  /** Drag preview width in pixels */
  width: number
  /** Drag preview height in pixels */
  height: number
}

/**
 * Scroll an element fully into view within a scroll container
 * @param container Scrollable ancestor
 * @param element Target element to reveal
 */
function scrollElementFullyIntoView(container: HTMLElement, element: HTMLElement) {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  if (elementRect.top < containerRect.top) {
    container.scrollTop += elementRect.top - containerRect.top
    return
  }

  if (elementRect.bottom > containerRect.bottom) {
    container.scrollTop += elementRect.bottom - containerRect.bottom
  }
}

/**
 * Vertical icon rail for asset filtering
 * @param props Filter state and change handler
 * @returns Icon sidebar element
 */
function LibrarySidebar(props: { active: LibrarySidebarFilter; onChange: (value: LibrarySidebarFilter) => void }) {
  const { active, onChange } = props

  return (
    <StudioIconSegmentRail
      aria-label="Asset library filter"
      value={active}
      onChange={onChange}
      options={SIDEBAR_FILTERS.map(({ value, label, Icon }) => ({ value, label, Icon }))}
    />
  )
}

/**
 * Map library kind filter to import scope
 * @param kindFilter Active library kind filter
 * @returns Import scope for file partitioning
 */
function getImportScopeForKindFilter(kindFilter: LibraryKindFilter): 'image' | 'video' | 'gif' {
  if (kindFilter === 'video') return 'video'
  if (kindFilter === 'gif') return 'gif'
  return 'image'
}

/**
 * Multi-select mode toggle for the library header
 * @param props Toggle state and change handler
 * @returns Icon toggle button element
 */
function LibraryMultiSelectToggle(props: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  const { enabled, onChange } = props

  return (
    <Tooltip content={enabled ? 'Exit multi-select' : 'Multi-select'}>
      <StudioPanelIconButton
        onClick={() => onChange(!enabled)}
        aria-label="Multi-select mode"
        aria-pressed={enabled}
        className={enabled ? 'bg-[var(--studio-accent-muted)] text-[var(--studio-accent)] hover:bg-[var(--studio-accent-muted)] hover:text-[var(--studio-accent-hover)]' : ''}
      >
        <MdChecklist className="h-4 w-4" />
      </StudioPanelIconButton>
    </Tooltip>
  )
}

/**
 * Studio library panel (Zone B)
 * @returns Library panel element
 */
export function LibraryPanel() {
  const {
    filteredAssets,
    assets,
    selectedIds,
    assetStatus,
    kindFilter,
    imageOriginFilter,
    setImageOriginFilter,
    toggleSelect,
    removeAssetsById,
    selectAll,
    clearSelection,
    setKindFilter,
    multiSelectMode,
    setMultiSelectMode,
    reorderLibraryAssets,
  } = useStudio()
  const { confirm } = useConfirm()
  const { importFromFiles } = useStudioFileImport()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const prevSelectedRef = useRef<string[]>([])
  const [dragState, setDragState] = useState<LibraryDragState | null>(null)
  const hoverIndexRef = useRef<number>(-1)
  const dragListenersRef = useRef<{
    onMove: (event: globalThis.PointerEvent) => void
    onUp: (event: globalThis.PointerEvent) => void
  } | null>(null)
  const filteredAssetsRef = useRef(filteredAssets)
  filteredAssetsRef.current = filteredAssets
  const importConfig = getLibraryImportConfig(kindFilter, imageOriginFilter)
  const sidebarFilter = getLibrarySidebarFilter(kindFilter, imageOriginFilter)

  const handleSidebarFilterChange = useCallback(
    (value: LibrarySidebarFilter) => {
      const { kind, imageOrigin } = parseLibrarySidebarFilter(value)
      setKindFilter(kind)
      setImageOriginFilter(imageOrigin)
    },
    [setKindFilter, setImageOriginFilter]
  )

  useEffect(() => {
    const prev = prevSelectedRef.current
    prevSelectedRef.current = selectedIds

    if (selectedIds.length === 0) return

    const added = selectedIds.filter((id) => !prev.includes(id))
    if (added.length === 0 && selectedIds.length <= prev.length) return

    const targetId = added.length > 0 ? (added.length > 1 ? added[0] : added[added.length - 1]) : selectedIds[0]
    if (!filteredAssets.some((asset) => asset.id === targetId)) return

    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const card = scrollEl.querySelector(`[data-library-asset-id="${targetId}"]`)
    if (!(card instanceof HTMLElement)) return

    requestAnimationFrame(() => {
      scrollElementFullyIntoView(scrollEl, card)
    })
  }, [selectedIds, filteredAssets])

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !importConfig.canImport) return
      await importFromFiles(fileList, getImportScopeForKindFilter(kindFilter))
      if (inputRef.current) inputRef.current.value = ''
    },
    [importConfig.canImport, importFromFiles, kindFilter]
  )

  const assetNameById = new Map(assets.map((a) => [a.id, a.name]))
  const selectionIndexById = new Map(selectedIds.map((id, index) => [id, index + 1]))

  const handleDeleteAsset = useCallback(
    async (id: string) => {
      const name = assets.find((asset) => asset.id === id)?.name ?? 'this asset'
      const confirmed = await confirm({
        title: 'Delete asset',
        message: `Delete "${name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
      if (confirmed) await removeAssetsById([id])
    },
    [assets, confirm, removeAssetsById]
  )

  useEffect(() => {
    if (!dragState) return
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.userSelect = ''
    }
  }, [dragState])

  /** Remove window-level listeners used during an active library drag */
  const detachDragListeners = useCallback(() => {
    const listeners = dragListenersRef.current
    if (!listeners) return
    window.removeEventListener('pointermove', listeners.onMove)
    window.removeEventListener('pointerup', listeners.onUp)
    window.removeEventListener('pointercancel', listeners.onUp)
    dragListenersRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      detachDragListeners()
    }
  }, [detachDragListeners])

  const draggedAsset = dragState ? filteredAssets.find((asset) => asset.id === dragState.id) : undefined

  const draggedAssetId = dragState?.id ?? null

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-library-slot]'))

    if (!dragState) {
      cards.forEach((el) => {
        el.style.transform = ''
        el.style.transition = ''
      })
      return
    }

    const count = filteredAssets.length
    const displayIndices = computeLibraryDisplayIndices(count, dragState.sourceIndex, dragState.hoverIndex)

    const cardById = new Map<string, HTMLElement>()
    cards.forEach((el) => {
      const id = el.dataset.librarySlot
      if (id) cardById.set(id, el)
    })

    const cellSize = measureLibraryGridCellSize(grid)
    if (!cellSize) return

    const gridStyle = window.getComputedStyle(grid)
    const columnGap = parseFloat(gridStyle.columnGap || '0') || 0
    const rowGap = parseFloat(gridStyle.rowGap || '0') || 0
    const cellWidth = cellSize.width + columnGap
    const cellHeight = cellSize.height + rowGap
    const columns = 2

    filteredAssets.forEach((asset, naturalIndex) => {
      const el = cardById.get(asset.id)
      if (!el) return

      if (asset.id === dragState.id) {
        el.style.transition = 'none'
        el.style.transform = ''
        return
      }

      const targetDisplayIndex = displayIndices[naturalIndex]

      const naturalCol = naturalIndex % columns
      const naturalRow = Math.floor(naturalIndex / columns)
      const targetCol = targetDisplayIndex % columns
      const targetRow = Math.floor(targetDisplayIndex / columns)

      const dx = (targetCol - naturalCol) * cellWidth
      const dy = (targetRow - naturalRow) * cellHeight

      el.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1)'
      el.style.transform = dx === 0 && dy === 0 ? '' : `translate(${dx}px, ${dy}px)`
    })
  }, [dragState, filteredAssets])

  const handleReorderPointerStart = useCallback(
    (id: string, context: LibraryReorderStartContext) => {
      const assets = filteredAssetsRef.current
      const sourceIndex = assets.findIndex((asset) => asset.id === id)
      if (sourceIndex === -1) return

      detachDragListeners()
      hoverIndexRef.current = sourceIndex

      setDragState({
        id,
        sourceIndex,
        hoverIndex: sourceIndex,
        pointerX: context.clientX,
        pointerY: context.clientY,
        offsetX: context.offsetX,
        offsetY: context.offsetY,
        width: context.width,
        height: context.height,
      })

      const onMove = (event: globalThis.PointerEvent) => {
        if (event.pointerId !== context.pointerId) return
        event.preventDefault()

        const scrollEl = scrollRef.current
        if (scrollEl) {
          autoScrollLibraryDrag(scrollEl, event.clientY)
        }

        const grid = gridRef.current

        setDragState((current) => {
          if (!current) return current

          const hoverIndex = grid ? resolveLibraryHoverIndex(event.clientX, event.clientY, grid, filteredAssetsRef.current.length, current.hoverIndex) : current.hoverIndex
          hoverIndexRef.current = hoverIndex

          return {
            ...current,
            hoverIndex,
            pointerX: event.clientX,
            pointerY: event.clientY,
          }
        })
      }

      const onUp = (event: globalThis.PointerEvent) => {
        if (event.pointerId !== context.pointerId) return

        detachDragListeners()

        const hoverIndex = hoverIndexRef.current
        const latestAssets = filteredAssetsRef.current
        const latestSourceIndex = latestAssets.findIndex((asset) => asset.id === id)

        setDragState(null)
        hoverIndexRef.current = -1

        if (latestSourceIndex === -1 || hoverIndex < 0 || latestSourceIndex === hoverIndex) return

        void reorderLibraryAssets(id, hoverIndex)
      }

      dragListenersRef.current = { onMove, onUp }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [detachDragListeners, reorderLibraryAssets]
  )

  return (
    <StudioPanel ref={panelRef} className="h-full w-studio-library shrink-0 border-r border-[var(--studio-surface-border)]">
      <StudioPanelHeader
        title="Library"
        actions={
          <>
            {multiSelectMode ? (
              <>
                <Tooltip content="Select all in filter">
                  <StudioPanelIconButton onClick={selectAll} aria-label="Select all">
                    <MdSelectAll className="h-4 w-4" />
                  </StudioPanelIconButton>
                </Tooltip>
                <Tooltip content="Clear selection">
                  <StudioPanelIconButton onClick={clearSelection} aria-label="Clear selection">
                    <MdDeselect className="h-4 w-4" />
                  </StudioPanelIconButton>
                </Tooltip>
              </>
            ) : importConfig.canImport ? (
              <>
                <Tooltip content={importConfig.tooltip}>
                  <StudioPanelIconButton onClick={() => inputRef.current?.click()} aria-label={importConfig.ariaLabel}>
                    <importConfig.Icon className="h-4 w-4" />
                  </StudioPanelIconButton>
                </Tooltip>
                <input ref={inputRef} type="file" accept={importConfig.accept} multiple className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
              </>
            ) : null}
            <LibraryMultiSelectToggle enabled={multiSelectMode} onChange={setMultiSelectMode} />
          </>
        }
      />

      <StudioPanelBody direction="row">
        <LibrarySidebar active={sidebarFilter} onChange={handleSidebarFilterChange} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {filteredAssets.length === 0 ? (
            <PanelEmptyState title="No assets" message={importConfig.emptyHint} />
          ) : (
            <>
              <ScrollArea ref={scrollRef} className="h-full min-h-0" scrollClassName="h-full">
                <div ref={gridRef} className={`grid grid-cols-2 gap-3 p-3 ${dragState ? 'transition-opacity duration-200' : ''}`} data-library-grid>
                  {filteredAssets.map((asset) => {
                    const isDragging = asset.id === draggedAssetId
                    return (
                      <div
                        key={asset.id}
                        className={isDragging ? 'pointer-events-none opacity-0' : ''}
                        style={isDragging ? { visibility: 'hidden' } : undefined}
                        data-library-slot={asset.id}
                      >
                        <AssetCard
                          asset={asset}
                          previewAsset={isTextDocumentAsset(asset) && asset.parentId ? assets.find((entry) => entry.id === asset.parentId) : undefined}
                          isSelected={selectedIds.includes(asset.id)}
                          multiSelectMode={multiSelectMode}
                          selectionIndex={selectionIndexById.get(asset.id)}
                          status={assetStatus[asset.id]}
                          parentName={asset.parentId ? assetNameById.get(asset.parentId) : undefined}
                          popoverAnchorRef={panelRef}
                          reorderable={!isPendingAsset(asset)}
                          layoutTransition={false}
                          suppressPopover={Boolean(dragState)}
                          onReorderPointerStart={handleReorderPointerStart}
                          onSelect={toggleSelect}
                          onDelete={(id) => void handleDeleteAsset(id)}
                        />
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
              {dragState && draggedAsset && typeof document !== 'undefined'
                ? createPortal(
                    <div
                      className="pointer-events-none fixed z-[9999] overflow-hidden rounded-studio-md shadow-studio-pop ring-2 ring-[var(--studio-accent)] transition-transform duration-75 ease-out will-change-transform"
                      style={{
                        left: dragState.pointerX - dragState.offsetX,
                        top: dragState.pointerY - dragState.offsetY,
                        width: dragState.width,
                        height: dragState.height,
                        transform: 'scale(1.05)',
                      }}
                    >
                      <AssetCard
                        asset={draggedAsset}
                        previewAsset={isTextDocumentAsset(draggedAsset) && draggedAsset.parentId ? assets.find((entry) => entry.id === draggedAsset.parentId) : undefined}
                        isSelected={selectedIds.includes(draggedAsset.id)}
                        multiSelectMode={multiSelectMode}
                        selectionIndex={selectionIndexById.get(draggedAsset.id)}
                        status={assetStatus[draggedAsset.id]}
                        parentName={draggedAsset.parentId ? assetNameById.get(draggedAsset.parentId) : undefined}
                        disableInteraction
                      />
                    </div>,
                    document.body
                  )
                : null}
            </>
          )}
        </div>
      </StudioPanelBody>
    </StudioPanel>
  )
}
