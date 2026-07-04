'use client'

/**
 * Album-style grid tile for a library asset
 */
import { type RefObject, useEffect, useState } from 'react'
import { FiTrash2, FiVideo } from 'react-icons/fi'

import { Popover } from '@/components/Popover'
import { getAssetObjectUrl, getVideoPosterUrl, mimeToLabel, sourceLabel } from '@/lib/studio/asset-helpers'
import { isPendingAsset } from '@/lib/studio/pending-asset'
import type { StudioAsset } from '@/lib/studio/types'

import type { AssetProcessStatus } from '../../hooks/studio-types'

interface AssetCardProps {
  /** Asset to display */
  asset: StudioAsset
  /** Whether selected */
  isSelected: boolean
  /** Multi-select mode shows ordered index badges */
  multiSelectMode?: boolean
  /** 1-based selection order when multi-select mode is active */
  selectionIndex?: number
  /** Processing status overlay */
  status?: AssetProcessStatus
  /** Parent asset name when derived */
  parentName?: string
  /** Click handler for selection */
  onSelect: (id: string) => void
  /** Delete handler */
  onDelete: (id: string) => void
  /** Panel edge used to pin hover popover on the library right side */
  popoverAnchorRef?: RefObject<HTMLElement | null>
}

/**
 * Build popover body for asset metadata
 * @param asset Source asset
 * @param parentName Optional parent display name
 * @returns Popover content element
 */
function AssetInfoPopoverContent(props: { asset: StudioAsset; parentName?: string }) {
  const { asset, parentName } = props
  const timestampMs = asset.meta?.timestampMs as number | undefined

  return (
    <div className="space-y-1.5">
      <p className="font-medium text-[var(--studio-surface-fg)] break-all leading-snug">{asset.name}</p>
      <p>
        {asset.width}×{asset.height} · {mimeToLabel(asset.mimeType)}
      </p>
      <p className="text-[var(--studio-surface-fg-muted)]">
        {sourceLabel(asset.source)} · {(asset.size / 1024).toFixed(1)} KB
      </p>
      {timestampMs != null && <p className="text-[var(--studio-surface-fg-muted)]">Timestamp: {timestampMs}ms</p>}
      {parentName && <p className="text-[var(--studio-surface-fg-subtle)]">From: {parentName}</p>}
    </div>
  )
}

/**
 * Library asset grid tile with hover popover and album selection affordances
 * @param props Component props
 * @returns Grid tile element
 */
export function AssetCard(props: AssetCardProps) {
  const { asset, isSelected, multiSelectMode = false, selectionIndex, status, parentName, onSelect, onDelete, popoverAnchorRef } = props
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [posterFailed, setPosterFailed] = useState(false)
  const pending = isPendingAsset(asset)

  useEffect(() => {
    if (pending) {
      setThumbUrl(null)
      setPosterFailed(false)
      return
    }
    let cancelled = false
    setPosterFailed(false)

    if (asset.kind === 'video') {
      setThumbUrl(null)
      getVideoPosterUrl(asset.id, asset.blob, asset.name, asset.mimeType).then((url) => {
        if (cancelled) return
        if (url) {
          setThumbUrl(url)
        } else {
          setPosterFailed(true)
        }
      })
      return () => {
        cancelled = true
      }
    }

    setThumbUrl(getAssetObjectUrl(asset.id, asset.blob))
    return () => {
      cancelled = true
    }
  }, [asset.id, asset.blob, asset.kind, asset.mimeType, asset.name, pending])

  return (
    <Popover placement="right" sideAnchorRef={popoverAnchorRef} content={<AssetInfoPopoverContent asset={asset} parentName={parentName} />}>
      <div
        data-library-asset-id={asset.id}
        className={`group relative aspect-square w-full overflow-hidden rounded-studio-md bg-[var(--studio-surface-subtle)] ring-1 transition-shadow ${
          isSelected ? 'ring-2 ring-[var(--studio-accent)] shadow-studio-md' : 'ring-[var(--studio-surface-border)] hover:ring-[var(--studio-surface-fg-subtle)]'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelect(asset.id)}
          className="absolute inset-0 z-0 flex items-center justify-center"
          aria-pressed={isSelected}
          aria-label={asset.name}
        >
          {thumbUrl ? (
            <>
              <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
              {asset.kind === 'video' ? (
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-[1] inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white">
                  <FiVideo className="h-3 w-3" aria-hidden />
                </span>
              ) : null}
            </>
          ) : pending ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--studio-surface-fg-subtle)]">Loading</span>
          ) : asset.kind === 'video' && posterFailed ? (
            <FiVideo className="h-8 w-8 text-[var(--studio-surface-fg-subtle)]" aria-hidden />
          ) : null}
        </button>

        {multiSelectMode && isSelected && selectionIndex != null ? (
          <span
            className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--studio-accent)] px-1 text-[10px] font-semibold leading-none text-[var(--studio-accent-fg)] shadow-studio-sm"
            aria-hidden
          >
            {selectionIndex}
          </span>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(asset.id)
          }}
          disabled={pending}
          className="absolute right-1.5 top-1.5 z-10 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
          aria-label={`Delete ${asset.name}`}
        >
          <FiTrash2 className="h-3.5 w-3.5" />
        </button>

        {status === 'processing' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-black/40 px-1.5 pb-1.5 pt-4">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
              <div className="inline-progress-indeterminate h-1 w-1/3 rounded-full bg-white" />
            </div>
          </div>
        )}
      </div>
    </Popover>
  )
}
