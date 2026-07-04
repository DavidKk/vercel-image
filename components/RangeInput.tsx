'use client'

/**
 * Custom styled native range input for Studio inspector panels
 */
import { type ChangeEvent, type CSSProperties, useId } from 'react'

import { STUDIO_RANGE_INPUT_CLASS } from './form-styles'

interface RangeInputProps {
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
  /** Input classes */
  className?: string
  /** Accessible label when not paired with a visible label */
  ariaLabel?: string
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
 * Compute filled track percentage for range styling
 * @param value Current value
 * @param min Minimum value
 * @param max Maximum value
 * @returns Percentage between 0 and 100
 */
function getFillPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return clampValue(((value - min) / (max - min)) * 100, 0, 100)
}

/**
 * Native range input with Studio track, fill, and thumb styling
 * @param props Range input configuration
 * @returns Range input element
 */
export function RangeInput(props: RangeInputProps) {
  const { id, value, onChange, min, max, step = 1, disabled = false, className = '', ariaLabel } = props
  const generatedId = useId()
  const inputId = id ?? generatedId
  const fillPercent = getFillPercent(value, min, max)

  const inputClass = [STUDIO_RANGE_INPUT_CLASS, className].filter(Boolean).join(' ')
  const fillStyle = { '--studio-range-fill': `${fillPercent}%` } as CSSProperties

  /**
   * Forward native change events as numeric values
   * @param event Change event from the range input
   * @returns Nothing
   */
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = Number(event.target.value)
    if (!Number.isFinite(nextValue)) return
    onChange(clampValue(nextValue, min, max))
  }

  return (
    <input
      id={inputId}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={handleChange}
      className={inputClass}
      style={fillStyle}
    />
  )
}
