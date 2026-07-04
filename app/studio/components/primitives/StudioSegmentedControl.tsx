'use client'

/**
 * Segmented control for Studio chrome (view modes, tabs)
 */
import type { ComponentType, ReactNode } from 'react'

/** Single segment option */
export interface StudioSegmentOption<T extends string = string> {
  /** Segment value */
  value: T
  /** Visible label */
  label: ReactNode
  /** Whether the segment is disabled */
  disabled?: boolean
}

interface StudioSegmentedControlProps<T extends string> {
  /** Available segments */
  options: StudioSegmentOption<T>[]
  /** Active segment value */
  value: T
  /** Change handler */
  onChange: (value: T) => void
  /** Accessible label for the control group */
  'aria-label': string
  /** Optional extra classes on the root */
  className?: string
}

/**
 * Chrome-style segmented control used in TopBar and similar surfaces
 * @param props Segment configuration
 * @returns Segmented control element
 */
export function StudioSegmentedControl<T extends string>(props: StudioSegmentedControlProps<T>) {
  const { options, value, onChange, 'aria-label': ariaLabel, className = '' } = props

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={['flex items-center gap-0.5 rounded-studio-md bg-[var(--studio-chrome-segment-bg)] p-0.5 ring-1 ring-[var(--studio-chrome-border)]', className]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={[
              'rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40',
              isActive
                ? 'bg-[var(--studio-chrome-segment-active)] text-[var(--studio-chrome-fg)] shadow-studio-sm'
                : 'text-[var(--studio-chrome-fg-muted)] hover:bg-[var(--studio-chrome-hover)] hover:text-[var(--studio-chrome-fg)]',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

interface StudioIconSegmentProps<T extends string = string> {
  /** Icon segment options */
  options: StudioIconSegmentOption<T>[]
  /** Active value */
  value: T
  /** Change handler */
  onChange: (value: T) => void
  /** Accessible label */
  'aria-label': string
  /** Optional root classes */
  className?: string
}

/** Icon segment option with typed value */
export interface StudioIconSegmentOption<T extends string = string> {
  /** Segment id */
  value: T
  /** Tooltip / aria label */
  label: string
  /** Icon component */
  Icon: ComponentType<{ className?: string }>
}

/**
 * Vertical icon rail for library filters and similar sidebar navigation
 * @param props Icon segment configuration
 * @returns Icon sidebar element
 */
export function StudioIconSegmentRail<T extends string>(props: StudioIconSegmentProps<T>) {
  const { options, value, onChange, 'aria-label': ariaLabel, className = '' } = props

  return (
    <nav
      aria-label={ariaLabel}
      className={['flex w-10 shrink-0 flex-col items-center gap-0.5 self-stretch border-r border-[var(--studio-surface-border)] bg-[var(--studio-surface-muted)] py-2', className]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map(({ value: optionValue, label, Icon }) => {
        const isActive = value === optionValue
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-label={label}
            aria-pressed={isActive}
            className={[
              'inline-flex h-8 w-8 items-center justify-center rounded-studio-md transition-colors',
              isActive
                ? 'bg-[var(--studio-accent-muted)] text-[var(--studio-accent)] shadow-studio-sm'
                : 'text-[var(--studio-surface-fg-muted)] hover:bg-[var(--studio-surface-subtle)] hover:text-[var(--studio-surface-fg)]',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </nav>
  )
}
