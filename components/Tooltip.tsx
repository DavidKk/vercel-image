'use client'

/**
 * Viewport-safe tooltip (short labels only).
 * Follows floating-layer baseline: portal render, hover + focus, role="tooltip".
 */
import { type CSSProperties, type ReactElement, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const GAP = 6
const PADDING = 8

/** Tooltip placement relative to trigger */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  /** Short text shown in the tooltip; keep concise so it stays in viewport */
  content: string
  /** Preferred position relative to trigger; default bottom */
  placement?: TooltipPlacement
  /** Optional classes for the trigger wrapper (e.g. flex-1 for full-width buttons) */
  wrapperClassName?: string
  children: ReactElement
}

/**
 * Compute fixed position for tooltip within viewport
 * @param trigger Trigger element rect
 * @param tooltip Tooltip element size
 * @param preferred Preferred placement
 * @returns Fixed left/top coordinates
 */
function computePosition(trigger: DOMRect, tooltip: { width: number; height: number }, preferred: TooltipPlacement): { left: number; top: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const { width: tw, height: th } = tooltip
  let left: number
  let top: number

  if (preferred === 'right') {
    left = Math.min(Math.max(PADDING, trigger.right + GAP), vw - tw - PADDING)
    top = Math.max(PADDING, Math.min(vh - th - PADDING, trigger.top + trigger.height / 2 - th / 2))
  } else if (preferred === 'left') {
    left = Math.max(PADDING, trigger.left - GAP - tw)
    top = Math.max(PADDING, Math.min(vh - th - PADDING, trigger.top + trigger.height / 2 - th / 2))
  } else if (preferred === 'top') {
    top = Math.max(PADDING, trigger.top - GAP - th)
    left = Math.max(PADDING, Math.min(vw - tw - PADDING, trigger.left + trigger.width / 2 - tw / 2))
  } else {
    const preferBottom = trigger.bottom + GAP + th <= vh - PADDING
    top = preferBottom ? trigger.bottom + GAP : Math.max(PADDING, trigger.top - GAP - th)
    left = Math.max(PADDING, Math.min(vw - tw - PADDING, trigger.left + trigger.width / 2 - tw / 2))
  }

  return { left, top }
}

/**
 * Viewport-safe tooltip rendered via portal to avoid clipping
 * @param props Tooltip configuration
 * @returns Trigger wrapper with portaled tooltip
 */
export function Tooltip(props: TooltipProps) {
  const { content, children, placement: preferredPlacement = 'bottom', wrapperClassName = '' } = props
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    visibility: 'hidden',
  })
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const tw = tooltipRef.current.offsetWidth
    const th = tooltipRef.current.offsetHeight
    const { left, top } = computePosition(rect, { width: tw, height: th }, preferredPlacement)
    setStyle({ left, top, position: 'fixed', visibility: 'visible' })
  }, [open, preferredPlacement, content])

  const tooltipEl =
    open &&
    (typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="z-[9999] max-w-[min(calc(100vw-16px),14rem)] rounded-md border border-gray-200 bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg whitespace-normal"
            style={style}
          >
            {content}
          </div>,
          document.body
        )
      : null)

  return (
    <>
      <span
        ref={triggerRef}
        className={['inline-flex items-center', wrapperClassName].filter(Boolean).join(' ')}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {tooltipEl}
    </>
  )
}
