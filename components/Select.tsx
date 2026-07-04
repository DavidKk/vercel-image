'use client'

/**
 * Custom dropdown select for Studio inspector panels
 */
import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiCheck, FiChevronDown } from 'react-icons/fi'

import { type SelectOption, STUDIO_SELECT_MENU_CLASS, STUDIO_SELECT_TRIGGER_CLASS } from './form-styles'

/** Estimated dropdown height used for viewport flipping */
const SELECT_MENU_MAX_HEIGHT = 224

/** Gap between trigger and dropdown panel */
const SELECT_MENU_GAP = 4

interface SelectProps {
  /** DOM id for the trigger button */
  id?: string
  /** Selected value */
  value: string
  /** Change handler */
  onChange: (value: string) => void
  /** Select options */
  options: SelectOption[]
  /** Disable interaction */
  disabled?: boolean
  /** Root wrapper classes */
  className?: string
  /** Placeholder when no value matches */
  placeholder?: string
}

/**
 * Compute fixed dropdown position relative to the trigger
 * @param triggerRect Trigger bounding rect
 * @param menuHeight Dropdown height in pixels
 * @returns Fixed top/left/width coordinates
 */
function computeMenuPosition(triggerRect: DOMRect, menuHeight: number) {
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  const spaceBelow = viewportHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top
  const openUpward = spaceBelow < menuHeight + SELECT_MENU_GAP && spaceAbove > spaceBelow

  return {
    top: openUpward ? triggerRect.top - SELECT_MENU_GAP - menuHeight : triggerRect.bottom + SELECT_MENU_GAP,
    left: triggerRect.left,
    width: triggerRect.width,
  }
}

/**
 * Custom dropdown select with portal menu and keyboard support
 * @param props Select configuration
 * @returns Select element
 */
export function Select(props: SelectProps) {
  const { id, value, onChange, options, disabled = false, className = '', placeholder = 'Select' } = props
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const listboxId = `${triggerId}-listbox`

  const selectedOption = options.find((option) => option.value === value)
  const selectedIndex = options.findIndex((option) => option.value === value)

  /**
   * Update dropdown position from trigger geometry
   * @returns Nothing
   */
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const list = listRef.current
    if (!trigger) return

    const measuredHeight = list ? Math.min(list.offsetHeight, SELECT_MENU_MAX_HEIGHT) : SELECT_MENU_MAX_HEIGHT
    setPosition(computeMenuPosition(trigger.getBoundingClientRect(), measuredHeight))
  }, [])

  /**
   * Select an option and close the menu
   * @param option Selected option
   * @returns Nothing
   */
  function selectOption(option: SelectOption) {
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  /**
   * Handle keyboard navigation on the trigger
   * @param event Keyboard event
   * @returns Nothing
   */
  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setHighlightIndex((index) => Math.min(options.length - 1, Math.max(0, index + 1)))
      return
    }

    if (event.key === 'ArrowUp' && open) {
      event.preventDefault()
      setHighlightIndex((index) => Math.max(0, index - 1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (open && highlightIndex >= 0) {
        const option = options[highlightIndex]
        if (option) selectOption(option)
        return
      }
      setOpen((prev) => !prev)
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      setOpen((prev) => !prev)
    }
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onViewportChange = () => updatePosition()
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [open, options, updatePosition])

  useEffect(() => {
    if (!open) return
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const rootClass = ['relative w-full', className].filter(Boolean).join(' ')
  const triggerClass = [
    STUDIO_SELECT_TRIGGER_CLASS,
    'flex items-center justify-between gap-2 text-left',
    open ? 'border-[var(--studio-accent)] ring-2 ring-[var(--studio-accent-ring)]' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClass}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <FiChevronDown className={`h-4 w-4 shrink-0 text-[var(--studio-surface-fg-subtle)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={triggerId}
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: SELECT_MENU_MAX_HEIGHT,
              }}
              className={`fixed z-[10001] overflow-hidden ${STUDIO_SELECT_MENU_CLASS}`}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                const isHighlighted = index === highlightIndex
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectOption(option)}
                    className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-[var(--studio-accent-muted)] text-[var(--studio-accent-hover)]'
                        : isHighlighted
                          ? 'bg-[var(--studio-surface-muted)] text-[var(--studio-surface-fg)]'
                          : 'text-[var(--studio-surface-fg)] hover:bg-[var(--studio-surface-muted)]'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <FiCheck className="h-4 w-4 shrink-0 text-[var(--studio-accent)]" aria-hidden /> : null}
                  </button>
                )
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
