'use client'

/**
 * Custom range slider for Studio inspector panels
 */
import { type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useId, useRef, useState } from 'react'

import { STUDIO_SLIDER_CLASS } from './form-styles'

interface SliderProps {
  /** DOM id */
  id?: string
  /** Current value */
  value: number
  /** Change handler */
  onChange: (value: number) => void
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Step increment */
  step?: number
  /** Disable interaction */
  disabled?: boolean
  /** Root classes */
  className?: string
}

/**
 * Clamp a numeric value between bounds
 * @param value Input value
 * @param min Minimum bound
 * @param max Maximum bound
 * @returns Clamped value
 */
function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Snap a value to the nearest step within bounds
 * @param value Input value
 * @param min Minimum bound
 * @param max Maximum bound
 * @param step Step increment
 * @returns Snapped value
 */
function snapToStep(value: number, min: number, max: number, step: number): number {
  if (step <= 0) return clampValue(value, min, max)
  const stepped = min + Math.round((value - min) / step) * step
  return clampValue(stepped, min, max)
}

/**
 * Compute slider fill percentage
 * @param value Current value
 * @param min Minimum value
 * @param max Maximum value
 * @returns Percentage between 0 and 100
 */
function getProgressPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return clampValue(((value - min) / (max - min)) * 100, 0, 100)
}

/**
 * Custom range slider with pointer drag and keyboard support
 * @param props Slider configuration
 * @returns Slider element
 */
export function Slider(props: SliderProps) {
  const { id, value, onChange, min, max, step = 1, disabled = false, className = '' } = props
  const [dragging, setDragging] = useState(false)
  const [focused, setFocused] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const generatedId = useId()
  const sliderId = id ?? generatedId

  const percent = getProgressPercent(value, min, max)

  /**
   * Resolve slider value from a horizontal pointer position
   * @param clientX Pointer X coordinate
   * @returns Snapped slider value
   */
  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return value

      const rect = track.getBoundingClientRect()
      if (rect.width <= 0) return value

      const ratio = clampValue((clientX - rect.left) / rect.width, 0, 1)
      const rawValue = min + ratio * (max - min)
      return snapToStep(rawValue, min, max, step)
    },
    [max, min, step, value]
  )

  /**
   * Apply a new slider value when it differs from the current value
   * @param nextValue Candidate value
   * @returns Nothing
   */
  const commitValue = useCallback(
    (nextValue: number) => {
      const snapped = snapToStep(nextValue, min, max, step)
      if (snapped !== value) onChange(snapped)
    },
    [max, min, onChange, step, value]
  )

  /**
   * Begin pointer drag interaction
   * @param event Pointer event on track or thumb
   * @returns Nothing
   */
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    commitValue(valueFromClientX(event.clientX))
  }

  /**
   * Update value while dragging
   * @param event Pointer move event
   * @returns Nothing
   */
  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || disabled) return
    commitValue(valueFromClientX(event.clientX))
  }

  /**
   * End pointer drag interaction
   * @param event Pointer up event
   * @returns Nothing
   */
  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
  }

  /**
   * Handle keyboard adjustments
   * @param event Keyboard event
   * @returns Nothing
   */
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      commitValue(value - step)
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      commitValue(value + step)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      commitValue(min)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      commitValue(max)
    }
  }

  useEffect(() => {
    if (!dragging) return

    function handleWindowPointerUp() {
      setDragging(false)
    }

    window.addEventListener('pointerup', handleWindowPointerUp)
    return () => window.removeEventListener('pointerup', handleWindowPointerUp)
  }, [dragging])

  const rootClass = [STUDIO_SLIDER_CLASS, disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', dragging ? 'cursor-grabbing' : '', className].filter(Boolean).join(' ')

  const thumbClass = [
    'absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow-sm transition-transform',
    disabled ? '' : dragging ? 'scale-110' : 'hover:scale-105',
    focused ? 'ring-2 ring-blue-500/30' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      id={sliderId}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled}
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={rootClass}
    >
      <div
        ref={trackRef}
        className="relative flex h-3.5 items-center touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-zinc-200" aria-hidden />
        <div className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-blue-600" style={{ width: `${percent}%` }} aria-hidden />
        <div className={thumbClass} style={{ left: `${percent}%` }} aria-hidden />
      </div>
    </div>
  )
}
