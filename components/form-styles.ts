/**
 * Shared Tailwind classes for Studio form controls
 */

/** Base text input styling */
export const STUDIO_INPUT_CLASS =
  'w-full rounded-lg border border-[var(--studio-panel-border)] bg-white px-2.5 py-1.5 text-sm text-gray-800 shadow-sm transition-colors placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50'

/** Custom select trigger button styling */
export const STUDIO_SELECT_TRIGGER_CLASS =
  'w-full rounded-lg border border-[var(--studio-panel-border)] bg-white py-1.5 pl-2.5 pr-2.5 text-sm text-gray-800 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50'

/** @deprecated Use STUDIO_SELECT_TRIGGER_CLASS — kept for backward compatibility */
export const STUDIO_SELECT_CLASS = STUDIO_SELECT_TRIGGER_CLASS

/** Custom select dropdown panel styling */
export const STUDIO_SELECT_MENU_CLASS = 'custom-scroll max-h-56 overflow-y-auto rounded-lg border border-[var(--studio-panel-border)] bg-white py-1 shadow-lg'

/** Custom range slider root styling */
export const STUDIO_SLIDER_CLASS = 'relative w-full select-none outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500/25'

/** Form field label */
export const STUDIO_FIELD_LABEL_CLASS = 'mb-1 block text-xs font-medium text-gray-600'

/** Form field hint text */
export const STUDIO_FIELD_HINT_CLASS = 'mt-0.5 text-[10px] text-gray-400'

/** Shared height for text-sm buttons and matching square icon buttons */
export const STUDIO_BUTTON_HEIGHT_CLASS = 'h-10'

/** Base text button styling (text-sm, fixed height; add color classes) */
export const STUDIO_BUTTON_TEXT_CLASS =
  'inline-flex items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/** Base square icon button styling (same height as text buttons; add color classes) */
export const STUDIO_BUTTON_ICON_CLASS = 'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/** Select option shape */
export interface SelectOption {
  /** Option value */
  value: string
  /** Display label */
  label: string
}
