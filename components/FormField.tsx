'use client'

/**
 * Form field wrapper with label and optional hint
 */
import type { ReactNode } from 'react'

import { STUDIO_FIELD_HINT_CLASS, STUDIO_FIELD_LABEL_CLASS } from './form-styles'

interface FormFieldProps {
  /** Field id linked to control */
  id?: string
  /** Field label */
  label: ReactNode
  /** Optional helper text below control */
  hint?: ReactNode
  /** Form control element */
  children: ReactNode
  /** Root wrapper classes */
  className?: string
}

/**
 * Labeled form field for Studio inspector panels
 * @param props Field configuration
 * @returns Field wrapper element
 */
export function FormField(props: FormFieldProps) {
  const { id, label, hint, children, className = '' } = props

  return (
    <div className={className}>
      <label htmlFor={id} className={STUDIO_FIELD_LABEL_CLASS}>
        {label}
      </label>
      {children}
      {hint ? <p className={STUDIO_FIELD_HINT_CLASS}>{hint}</p> : null}
    </div>
  )
}
