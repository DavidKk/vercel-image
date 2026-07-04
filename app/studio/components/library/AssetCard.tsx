'use client'

/**
 * Album-style grid tile for a library asset
 */
import { type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { FiTrash2, FiType, FiVideo } from 'react-icons/fi'

import { Popover } from '@/components/Popover'
import { getAssetObjectUrl, getVideoPosterUrl, mimeToLabel, sourceLabel } from '@/lib/studio/asset-helpers'
import { isPendingAsset } from '@/lib/studio/pending-asset'
import { isTextDocumentAsset, parseTextDocument, renderTextDocument } from '@/lib/studio/text-document'
import type { StudioAsset } from '@/lib/studio/types'

import type { AssetProcessStatus } from '../../hooks/studio-types'

/** Context passed when a reorder drag starts */
export interface LibraryReorderStartContext {
  /** Active pointer id */
  pointerId: number
  /** Pointer X in viewport coordinates */
  clientX: number
  /** Pointer Y in viewport coordinates */
  clientY: number
  /** Pointer offset from the card's left edge */
  offsetX: number
  /** Pointer offset from the card's top edge */
  offsetY: number
  /** Card width in pixels */
  width: number
  /** Card height in pixels */
  height: number
}

interface AssetCardProps {
  /** Asset to display */
  asset: StudioAsset
  /** Asset used for thumbnail preview (e.g. base image of a text document) */
  previewAsset?: StudioAsset
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
  /** Click handler for selection (omit for non-interactive drag preview) */
  onSelect?: (id: string) => void
  /** Delete handler (omit for non-interactive drag preview) */
  onDelete?: (id: string) => void
  /** Panel edge used to pin hover popover on the library right side */
  popoverAnchorRef?: RefObject<HTMLElement | null>
  /** Whether the card can be reordered via drag */
  reorderable?: boolean
  /** Whether this card is the active drop target */
  isDropTarget?: boolean
  /** Whether layout changes should animate */
  layoutTransition?: boolean
  /** Disable hover popover and interactions (floating drag preview) */
  disableInteraction?: boolean
  /** Suppress hover popover while another card is being dragged */
  suppressPopover?: boolean
  /** Pointer reorder drag started; parent owns move/up until drop */
  onReorderPointerStart?: (id: string, context: LibraryReorderStartContext) => void
}

/** Pointer movement before a press becomes a reorder drag */
const DRAG_START_THRESHOLD_PX = 6

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
  const {
    asset,
    isSelected,
    multiSelectMode = false,
    selectionIndex,
    status,
    parentName,
    onSelect,
    onDelete,
    popoverAnchorRef,
    reorderable = false,
    isDropTarget = false,
    layoutTransition = false,
    disableInteraction = false,
    suppressPopover = false,
    onReorderPointerStart,
  } = props
  const visualAsset = props.previewAsset ?? asset
  const cardRef = useRef<HTMLDivElement>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const reorderActiveRef = useRef(false)
  const suppressClickRef = useRef(false)
  const windowListenersRef = useRef<{
    onMove: (event: globalThis.PointerEvent) => void
    onUp: (event: globalThis.PointerEvent) => void
  } | null>(null)
  const pointerDownEventRef = useRef<PointerEvent<HTMLElement> | null>(null)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [posterFailed, setPosterFailed] = useState(false)
  const [textThumbFailed, setTextThumbFailed] = useState(false)
  const pending = isPendingAsset(asset)

  const isTextDoc = isTextDocumentAsset(asset)
  const previewAsset = props.previewAsset
  /** Content fingerprint that only changes when the visible payload changes */
  const contentKey = isTextDoc
    ? `text:${asset.id}:${asset.updatedAt}:${asset.size}:${previewAsset?.id ?? ''}:${previewAsset?.updatedAt ?? ''}`
    : `${visualAsset.kind}:${visualAsset.id}:${visualAsset.updatedAt}:${visualAsset.size}`

  useEffect(() => {
    if (pending) {
      setThumbUrl(null)
      setPosterFailed(false)
      setTextThumbFailed(false)
      return
    }
    let cancelled = false
    let objectUrl: string | null = null
    setPosterFailed(false)
    setTextThumbFailed(false)

    if (asset.kind === 'video') {
      getVideoPosterUrl(visualAsset.id, visualAsset.blob, visualAsset.name, visualAsset.mimeType)
        .then((url) => {
          if (cancelled) return
          if (url) {
            setThumbUrl(url)
          } else {
            setThumbUrl(null)
            setPosterFailed(true)
          }
        })
        .catch(() => {
          if (cancelled) return
          setThumbUrl(null)
          setPosterFailed(true)
        })
      return () => {
        cancelled = true
      }
    }

    if (isTextDoc) {
      if (!previewAsset) {
        setThumbUrl(null)
        return () => {
          cancelled = true
        }
      }

      void (async () => {
        try {
          const content = await parseTextDocument(asset)
          if (cancelled || !content) {
            if (!cancelled) {
              setThumbUrl(null)
              setTextThumbFailed(true)
            }
            return
          }
          const blob = await renderTextDocument(previewAsset, content)
          if (cancelled) return
          objectUrl = URL.createObjectURL(blob)
          setThumbUrl(objectUrl)
        } catch {
          if (!cancelled) {
            setThumbUrl(null)
            setTextThumbFailed(true)
          }
        }
      })()
      return () => {
        cancelled = true
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

    if (!visualAsset.mimeType.startsWith('image/')) {
      setThumbUrl(null)
      return () => {
        cancelled = true
      }
    }

    setThumbUrl(getAssetObjectUrl(visualAsset.id, visualAsset.blob))
    return () => {
      cancelled = true
    }
  }, [contentKey, pending])

  useEffect(() => {
    return () => {
      const listeners = windowListenersRef.current
      if (!listeners) return
      window.removeEventListener('pointermove', listeners.onMove)
      window.removeEventListener('pointerup', listeners.onUp)
      window.removeEventListener('pointercancel', listeners.onUp)
      windowListenersRef.current = null
    }
  }, [])

  /** Remove window-level pointer listeners used during reorder tracking */
  function detachWindowListeners() {
    const listeners = windowListenersRef.current
    if (!listeners) return
    window.removeEventListener('pointermove', listeners.onMove)
    window.removeEventListener('pointerup', listeners.onUp)
    window.removeEventListener('pointercancel', listeners.onUp)
    windowListenersRef.current = null
  }

  /** Reset local reorder gesture state */
  function resetReorderGesture() {
    detachWindowListeners()
    pointerStartRef.current = null
    pointerDownEventRef.current = null
    activePointerIdRef.current = null
    reorderActiveRef.current = false
  }

  /**
   * Enter active reorder mode after the drag threshold is crossed
   * @param pointerId Active pointer identifier
   */
  function startReorderDrag(pointerId: number) {
    const card = cardRef.current
    const downEvent = pointerDownEventRef.current
    if (!card || !downEvent || reorderActiveRef.current) return

    const rect = card.getBoundingClientRect()

    reorderActiveRef.current = true
    suppressClickRef.current = true

    onReorderPointerStart?.(asset.id, {
      pointerId,
      clientX: downEvent.clientX,
      clientY: downEvent.clientY,
      offsetX: downEvent.clientX - rect.left,
      offsetY: downEvent.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    })

    detachWindowListeners()
  }

  /**
   * Begin tracking a pointer for click vs drag-to-reorder
   * @param event Pointer down on the card
   */
  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (!reorderable || disableInteraction || event.button !== 0) return
    if ((event.target as HTMLElement).closest('button[aria-label^="Delete"]')) return

    event.preventDefault()

    pointerDownEventRef.current = event
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    activePointerIdRef.current = event.pointerId
    reorderActiveRef.current = false
    suppressClickRef.current = false

    const pointerId = event.pointerId

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return

      if (reorderActiveRef.current) return

      if (!pointerStartRef.current) return

      const dx = moveEvent.clientX - pointerStartRef.current.x
      const dy = moveEvent.clientY - pointerStartRef.current.y
      if (Math.hypot(dx, dy) < DRAG_START_THRESHOLD_PX) return
      startReorderDrag(pointerId)
    }

    const onUp = (upEvent: globalThis.PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return
      resetReorderGesture()
    }

    detachWindowListeners()
    windowListenersRef.current = { onMove, onUp }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const cardElement = (
    <div
      ref={cardRef}
      data-library-asset-id={asset.id}
      className={`group relative aspect-square w-full touch-pan-y overflow-hidden rounded-studio-md bg-[var(--studio-surface-subtle)] ring-1 ${
        layoutTransition ? 'transition-all duration-200 ease-out' : 'transition-[box-shadow,opacity]'
      } ${
        isDropTarget
          ? 'ring-2 ring-[var(--studio-accent)] shadow-studio-md'
          : isSelected
            ? 'ring-2 ring-[var(--studio-accent)] shadow-studio-md'
            : 'ring-[var(--studio-surface-border)] hover:ring-[var(--studio-surface-fg-subtle)]'
      } ${reorderable && !disableInteraction ? 'cursor-grab select-none active:cursor-grabbing' : ''}`}
    >
      <button
        type="button"
        onPointerDown={(event) => {
          if (!reorderable || disableInteraction) return
          event.stopPropagation()
          handlePointerDown(event)
        }}
        onClick={() => {
          if (suppressClickRef.current) return
          onSelect?.(asset.id)
        }}
        className={`absolute inset-0 z-0 flex items-center justify-center ${reorderable && !disableInteraction ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        aria-pressed={isSelected}
        aria-label={asset.name}
      >
        {thumbUrl ? (
          <>
            <img
              src={thumbUrl}
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
              onError={() => {
                setThumbUrl(null)
                if (isTextDoc) setTextThumbFailed(true)
              }}
            />
            {asset.kind === 'video' ? (
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-[1] inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white">
                <FiVideo className="h-3 w-3" aria-hidden />
              </span>
            ) : isTextDocumentAsset(asset) ? (
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-[1] inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white">
                <FiType className="h-3 w-3" aria-hidden />
              </span>
            ) : null}
          </>
        ) : pending ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--studio-surface-fg-subtle)]">Loading</span>
        ) : asset.kind === 'video' && posterFailed ? (
          <FiVideo className="h-8 w-8 text-[var(--studio-surface-fg-subtle)]" aria-hidden />
        ) : isTextDoc && (textThumbFailed || !previewAsset) ? (
          <FiType className="h-8 w-8 text-[var(--studio-surface-fg-subtle)]" aria-hidden />
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

      {!disableInteraction ? (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(asset.id)
          }}
          disabled={pending}
          className="absolute right-1.5 top-1.5 z-10 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
          aria-label={`Delete ${asset.name}`}
        >
          <FiTrash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {status === 'processing' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-black/40 px-1.5 pb-1.5 pt-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
            <div className="inline-progress-indeterminate h-1 w-1/3 rounded-full bg-white" />
          </div>
        </div>
      )}
    </div>
  )

  if (disableInteraction || suppressPopover) {
    return cardElement
  }

  return (
    <Popover placement="right" sideAnchorRef={popoverAnchorRef} content={<AssetInfoPopoverContent asset={asset} parentName={parentName} />}>
      {cardElement}
    </Popover>
  )
}
