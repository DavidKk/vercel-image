/**
 * Shared Tailwind class strings for Studio UI primitives.
 * All colors reference CSS variables from app/studio/theme/studio-tokens.css.
 */

/** Base text input styling */
export const STUDIO_INPUT_CLASS =
  'w-full rounded-studio-md border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] px-2.5 py-1.5 text-sm text-[var(--studio-surface-fg)] shadow-studio-sm transition-colors placeholder:text-[var(--studio-surface-fg-subtle)] hover:border-[var(--studio-surface-fg-subtle)] focus:border-[var(--studio-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--studio-accent-ring)] disabled:cursor-not-allowed disabled:opacity-50'

/** Custom select trigger button styling */
export const STUDIO_SELECT_TRIGGER_CLASS =
  'w-full rounded-studio-md border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] py-1.5 pl-2.5 pr-2.5 text-sm text-[var(--studio-surface-fg)] shadow-studio-sm transition-colors hover:border-[var(--studio-surface-fg-subtle)] focus:border-[var(--studio-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--studio-accent-ring)] disabled:cursor-not-allowed disabled:opacity-50'

/** @deprecated Use STUDIO_SELECT_TRIGGER_CLASS */
export const STUDIO_SELECT_CLASS = STUDIO_SELECT_TRIGGER_CLASS

/** Custom select dropdown panel styling */
export const STUDIO_SELECT_MENU_CLASS =
  'custom-scroll max-h-56 overflow-y-auto rounded-studio-md border border-[var(--studio-surface-border,#e4e4e7)] bg-white bg-[var(--studio-surface-bg,#ffffff)] py-1 shadow-studio-pop'

/** Custom range slider root styling */
export const STUDIO_SLIDER_CLASS = 'relative w-full min-w-0 select-none outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--studio-accent-ring)]'

/** Native range input with Studio track and thumb styling */
export const STUDIO_RANGE_INPUT_CLASS = 'studio-range-input block w-full min-w-0'

/** Form field label */
export const STUDIO_FIELD_LABEL_CLASS = 'mb-1 block text-xs font-medium text-[var(--studio-surface-fg-muted)]'

/** Form field hint text */
export const STUDIO_FIELD_HINT_CLASS = 'mt-0.5 text-[10px] text-[var(--studio-surface-fg-subtle)]'

/** Shared height for text-sm buttons and matching square icon buttons */
export const STUDIO_BUTTON_HEIGHT_CLASS = 'h-9'

/** Base text button styling */
export const STUDIO_BUTTON_TEXT_CLASS =
  'inline-flex items-center justify-center rounded-studio-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/** Base square icon button styling */
export const STUDIO_BUTTON_ICON_CLASS = 'inline-flex shrink-0 items-center justify-center rounded-studio-md transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/** Primary accent button */
export const STUDIO_BUTTON_PRIMARY_CLASS = [
  STUDIO_BUTTON_HEIGHT_CLASS,
  STUDIO_BUTTON_TEXT_CLASS,
  'bg-[var(--studio-accent)] text-[var(--studio-accent-fg)] hover:bg-[var(--studio-accent-hover)]',
].join(' ')

/** Secondary / ghost button on surface */
export const STUDIO_BUTTON_SECONDARY_CLASS = [
  STUDIO_BUTTON_HEIGHT_CLASS,
  STUDIO_BUTTON_TEXT_CLASS,
  'border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] text-[var(--studio-surface-fg-muted)] hover:bg-[var(--studio-surface-muted)] hover:text-[var(--studio-surface-fg)]',
].join(' ')

/** Select option shape */
export interface SelectOption {
  /** Option value */
  value: string
  /** Display label */
  label: string
}
