'use client'

/**
 * Hover popover for richer content than Tooltip (metadata panels, etc.).
 * Portal-rendered; stays open while pointer is over trigger or popover.
 */
import { type CSSProperties, type ReactElement, type ReactNode, type RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const GAP = 8
const PADDING = 8
const HIDE_DELAY_MS = 120

/** Popover placement relative to trigger */
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

interface PopoverProps {
  /** Popover body (may be multi-line) */
  content: ReactNode
  /** Preferred placement; default right for side panels */
  placement?: PopoverPlacement
  /**
   * When set, horizontal placement for left/right uses this element's edge
   * instead of the trigger (e.g. pin popover to a panel's right edge).
   */
  sideAnchorRef?: RefObject<HTMLElement | null>
  /** Element that opens the popover on hover */
  children: ReactElement
}

/**
 * Compute fixed position for popover within viewport
 * @param trigger Trigger element rect
 * @param popover Popover element size
 * @param preferred Preferred placement
 * @returns Fixed left/top coordinates
 */
function computePosition(trigger: DOMRect, popover: { width: number; height: number }, preferred: PopoverPlacement, sideAnchor?: DOMRect | null): { left: number; top: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const { width: pw, height: ph } = popover
  let left: number
  let top: number

  if (preferred === 'right') {
    const anchorRight = sideAnchor?.right ?? trigger.right
    left = Math.min(Math.max(PADDING, anchorRight + GAP), vw - pw - PADDING)
    top = Math.max(PADDING, Math.min(vh - ph - PADDING, trigger.top + trigger.height / 2 - ph / 2))
  } else if (preferred === 'left') {
    const anchorLeft = sideAnchor?.left ?? trigger.left
    left = Math.max(PADDING, anchorLeft - GAP - pw)
    top = Math.max(PADDING, Math.min(vh - ph - PADDING, trigger.top + trigger.height / 2 - ph / 2))
  } else if (preferred === 'top') {
    top = Math.max(PADDING, trigger.top - GAP - ph)
    left = Math.max(PADDING, Math.min(vw - pw - PADDING, trigger.left + trigger.width / 2 - pw / 2))
  } else {
    top = Math.min(Math.max(PADDING, trigger.bottom + GAP), vh - ph - PADDING)
    left = Math.max(PADDING, Math.min(vw - pw - PADDING, trigger.left + trigger.width / 2 - pw / 2))
  }

  return { left, top }
}

/**
 * Hover-triggered popover with delayed hide for pointer travel
 * @param props Popover configuration
 * @returns Trigger wrapper with portaled popover
 */
export function Popover(props: PopoverProps) {
  const { content, children, placement: preferredPlacement = 'right', sideAnchorRef } = props
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    visibility: 'hidden',
  })
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    cancelHide()
    hideTimerRef.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS)
  }, [cancelHide])

  const show = useCallback(() => {
    cancelHide()
    setOpen(true)
  }, [cancelHide])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !popoverRef.current) return

    function updatePosition() {
      if (!triggerRef.current || !popoverRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const sideAnchor = sideAnchorRef?.current?.getBoundingClientRect() ?? null
      const pw = popoverRef.current.offsetWidth
      const ph = popoverRef.current.offsetHeight
      const { left, top } = computePosition(rect, { width: pw, height: ph }, preferredPlacement, sideAnchor)
      setStyle({ left, top, position: 'fixed', visibility: 'visible' })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, preferredPlacement, content, sideAnchorRef])

  useLayoutEffect(() => {
    return () => cancelHide()
  }, [cancelHide])

  const popoverEl =
    open &&
    (typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            className="z-[9998] max-w-[min(calc(100vw-24px),16rem)] rounded-studio-md border border-[var(--studio-surface-border,#e4e4e7)] bg-[var(--studio-surface-bg,#ffffff)] px-3 py-2.5 text-xs text-[var(--studio-surface-fg,#18181b)] shadow-studio-pop"
            style={style}
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
          >
            {content}
          </div>,
          document.body
        )
      : null)

  return (
    <>
      <span ref={triggerRef} className="block w-full h-full" onMouseEnter={show} onMouseLeave={scheduleHide}>
        {children}
      </span>
      {popoverEl}
    </>
  )
}
