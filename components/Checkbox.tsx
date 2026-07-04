'use client'

/**
 * Custom checkbox styled for Studio and shared form panels
 */
import type { ReactNode } from 'react'
import { FiCheck } from 'react-icons/fi'

interface CheckboxProps {
  /** DOM id for label association */
  id?: string
  /** Checked state */
  checked: boolean
  /** Change handler */
  onChange: (checked: boolean) => void
  /** Optional label content */
  label?: ReactNode
  /** Disable interaction */
  disabled?: boolean
  /** Root label classes */
  className?: string
}

/**
 * Accessible custom checkbox with hidden native input
 * @param props Checkbox configuration
 * @returns Checkbox element
 */
export function Checkbox(props: CheckboxProps) {
  const { id, checked, onChange, label, disabled = false, className = '' } = props
  const rootClass = ['group flex w-full items-center gap-2', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', className].filter(Boolean).join(' ')

  return (
    <label htmlFor={id} className={rootClass}>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-500 ${
          checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-transparent group-hover:border-gray-400'
        }`}
      >
        <FiCheck className="h-3 w-3" strokeWidth={3} />
      </span>
      {label != null ? <span className="select-none">{label}</span> : null}
    </label>
  )
}
