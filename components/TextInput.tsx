'use client'

/**
 * Custom text input styled for Studio inspector panels
 */
import { STUDIO_INPUT_CLASS } from './form-styles'

interface TextInputProps {
  /** DOM id */
  id?: string
  /** Input value */
  value: string
  /** Change handler */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Disable interaction */
  disabled?: boolean
  /** Input classes */
  className?: string
}

/**
 * Styled single-line text input
 * @param props Text input configuration
 * @returns Text input element
 */
export function TextInput(props: TextInputProps) {
  const { id, value, onChange, placeholder, disabled = false, className = '' } = props
  const inputClass = [STUDIO_INPUT_CLASS, className].filter(Boolean).join(' ')

  return <input id={id} type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={inputClass} />
}
