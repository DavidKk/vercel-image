'use client'

/**
 * Scroll container with hidden native scrollbar and a 2px position indicator (non-draggable).
 */
import { forwardRef, type HTMLAttributes, type ReactNode, type UIEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Width of the faux scrollbar track in CSS pixels */
const INDICATOR_TRACK_PX = 2

/** Minimum thumb height when content overflows */
const MIN_THUMB_PX = 2

interface ScrollAreaProps {
  /** Scrollable content */
  children: ReactNode
  /** Classes on the outer relative wrapper */
  className?: string
  /** Classes on the scroll container */
  scrollClassName?: string
  /** Extra attributes for the scroll container */
  scrollProps?: Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'ref' | 'style'>
}

type ThumbState = { top: number; height: number }

/**
 * Compare thumb states for equality
 * @param a First thumb state
 * @param b Second thumb state
 * @returns Whether positions match
 */
function thumbsEqual(a: ThumbState | null, b: ThumbState | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return a.top === b.top && a.height === b.height
}

/**
 * Scrollable region with a thin non-interactive position indicator
 * @param props Scroll area configuration
 * @param ref Ref to the scroll container
 * @returns Relative wrapper with scroll content and indicator
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(props, forwardedRef) {
  const { children, className, scrollClassName, scrollProps } = props
  const { onScroll: userOnScroll, ...restScrollProps } = scrollProps ?? {}

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastThumbRef = useRef<ThumbState | null | undefined>(undefined)
  const forwardedRefRef = useRef(forwardedRef)
  forwardedRefRef.current = forwardedRef
  const rafSyncRef = useRef(0)

  const setScrollElement = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el
    const ref = forwardedRefRef.current
    if (typeof ref === 'function') {
      ref(el)
    } else if (ref) {
      ref.current = el
    }
  }, [])

  const [thumb, setThumb] = useState<ThumbState | null>(null)

  const commitThumb = useCallback((next: ThumbState | null) => {
    if (lastThumbRef.current !== undefined && thumbsEqual(lastThumbRef.current, next)) return
    lastThumbRef.current = next
    setThumb(next)
  }, [])

  const syncThumb = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      commitThumb(null)
      return
    }
    const { scrollHeight, clientHeight, scrollTop } = el
    if (scrollHeight <= clientHeight) {
      commitThumb(null)
      return
    }
    const thumbHeight = Math.max(MIN_THUMB_PX, Math.round((clientHeight / scrollHeight) * clientHeight))
    const maxScroll = scrollHeight - clientHeight
    const thumbTop = maxScroll <= 0 ? 0 : Math.round((scrollTop / maxScroll) * Math.max(0, clientHeight - thumbHeight))
    commitThumb({ top: thumbTop, height: thumbHeight })
  }, [commitThumb])

  const scheduleSyncThumb = useCallback(() => {
    if (rafSyncRef.current !== 0) return
    rafSyncRef.current = requestAnimationFrame(() => {
      rafSyncRef.current = 0
      syncThumb()
    })
  }, [syncThumb])

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      scheduleSyncThumb()
      userOnScroll?.(event)
    },
    [scheduleSyncThumb, userOnScroll]
  )

  useLayoutEffect(() => {
    syncThumb()
  }, [syncThumb])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const ro = new ResizeObserver(() => scheduleSyncThumb())
    ro.observe(el)
    const mo = new MutationObserver(() => scheduleSyncThumb())
    mo.observe(el, { childList: true, subtree: true })

    return () => {
      ro.disconnect()
      mo.disconnect()
      if (rafSyncRef.current !== 0) {
        cancelAnimationFrame(rafSyncRef.current)
        rafSyncRef.current = 0
      }
    }
  }, [scheduleSyncThumb])

  const wrapperClass = ['relative min-h-0 overflow-hidden', className].filter(Boolean).join(' ')
  const scrollClass = ['custom-scroll overflow-auto min-h-0', scrollClassName].filter(Boolean).join(' ')

  return (
    <div className={wrapperClass}>
      <div ref={setScrollElement} {...restScrollProps} onScroll={handleScroll} className={scrollClass}>
        {children}
      </div>
      {thumb ? (
        <div className="pointer-events-none absolute bottom-0 right-0.5 top-0" style={{ width: INDICATOR_TRACK_PX }} aria-hidden>
          <div className="absolute left-0 rounded-full bg-gray-400" style={{ width: INDICATOR_TRACK_PX, height: thumb.height, top: thumb.top }} />
        </div>
      ) : null}
    </div>
  )
})

ScrollArea.displayName = 'ScrollArea'
