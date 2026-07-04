'use client'

/**
 * Zone B: asset library with left icon rail filters, album grid, and custom scroll
 */
import { type ComponentType, useCallback, useEffect, useRef } from 'react'
import { FiImage, FiVideo } from 'react-icons/fi'
import { MdAutoFixHigh, MdChecklist, MdDeselect, MdGif, MdSelectAll, MdViewModule } from 'react-icons/md'

import { useConfirm } from '@/components/confirm-dialog'
import { PanelEmptyState } from '@/components/PanelEmptyState'
import { ScrollArea } from '@/components/ScrollArea'
import { Tooltip } from '@/components/Tooltip'

import { useStudio } from '../../context/StudioContext'
import { getLibrarySidebarFilter, type LibraryKindFilter, type LibrarySidebarFilter, parseLibrarySidebarFilter } from '../../hooks/studio-url-query'
import { useStudioFileImport } from '../../hooks/useStudioFileImport'
import { StudioIconSegmentRail } from '../primitives/StudioSegmentedControl'
import { StudioPanel, StudioPanelBody, StudioPanelHeader, StudioPanelIconButton } from '../StudioPanel'
import { AssetCard } from './AssetCard'
import { getLibraryImportConfig } from './library-import'

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
  } = useStudio()
  const { confirm } = useConfirm()
  const { importFromFiles } = useStudioFileImport()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevSelectedRef = useRef<string[]>([])
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
            <ScrollArea ref={scrollRef} className="h-full min-h-0" scrollClassName="h-full">
              <div className="grid grid-cols-2 gap-3 p-3">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedIds.includes(asset.id)}
                    multiSelectMode={multiSelectMode}
                    selectionIndex={selectionIndexById.get(asset.id)}
                    status={assetStatus[asset.id]}
                    parentName={asset.parentId ? assetNameById.get(asset.parentId) : undefined}
                    popoverAnchorRef={panelRef}
                    onSelect={toggleSelect}
                    onDelete={(id) => void handleDeleteAsset(id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </StudioPanelBody>
    </StudioPanel>
  )
}
