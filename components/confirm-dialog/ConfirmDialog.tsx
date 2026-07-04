'use client'

/**
 * Modal confirm dialog for destructive or irreversible actions
 */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { STUDIO_BUTTON_HEIGHT_CLASS, STUDIO_BUTTON_PRIMARY_CLASS, STUDIO_BUTTON_SECONDARY_CLASS, STUDIO_BUTTON_TEXT_CLASS } from '@/components/form-styles'

import type { ConfirmOptions } from './types'

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Dialog configuration */
  options: ConfirmOptions
  /** Called when the user cancels or dismisses the dialog */
  onCancel: () => void
  /** Called when the user confirms the action */
  onConfirm: () => void
}

/**
 * Render a centered confirm dialog in a portal
 * @param props Dialog props
 * @returns Portal element or null
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, options, onCancel, onConfirm } = props
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    confirmRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open || typeof document === 'undefined') return null

  const title = options.title ?? 'Confirm'
  const confirmLabel = options.confirmLabel ?? 'Confirm'
  const cancelLabel = options.cancelLabel ?? 'Cancel'
  const confirmButtonClass = options.destructive
    ? `${STUDIO_BUTTON_HEIGHT_CLASS} ${STUDIO_BUTTON_TEXT_CLASS} px-3 bg-[var(--studio-danger)] text-[var(--studio-danger-fg)] hover:opacity-90`
    : `${STUDIO_BUTTON_PRIMARY_CLASS} px-3`

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-sm rounded-studio-lg border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] p-4 shadow-studio-pop"
      >
        <h2 id="confirm-dialog-title" className="text-sm font-semibold text-[var(--studio-surface-fg)]">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm leading-snug text-[var(--studio-surface-fg-muted)]">
          {options.message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={`${STUDIO_BUTTON_SECONDARY_CLASS} px-3`}>
            {cancelLabel}
          </button>
          <button ref={confirmRef} type="button" onClick={onConfirm} className={confirmButtonClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
