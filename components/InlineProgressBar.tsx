'use client'

/**
 * Compact inline progress bar for Studio loading states
 */

/** Visual size preset for the progress bar */
export type InlineProgressBarSize = 'sm' | 'md'

/** Label and bar arrangement */
export type InlineProgressBarLayout = 'inline' | 'stack'

/** Label and bar horizontal alignment */
export type InlineProgressBarAlign = 'start' | 'end'

export interface InlineProgressBarProps {
  /** Status description shown beside or above the bar */
  label: string
  /** Determinate progress from 0 to 100 */
  progress?: number
  /** Use animated indeterminate bar when progress is unknown */
  indeterminate?: boolean
  /** Visual size preset */
  size?: InlineProgressBarSize
  /** Label and bar arrangement */
  layout?: InlineProgressBarLayout
  /** Horizontal alignment of the label + bar group */
  align?: InlineProgressBarAlign
  /** Root wrapper classes */
  className?: string
}

/** Track height classes per size preset */
const TRACK_SIZE_CLASS: Record<InlineProgressBarSize, string> = {
  sm: 'h-0.5',
  md: 'h-1',
}

/** Label typography classes per size preset */
const LABEL_SIZE_CLASS: Record<InlineProgressBarSize, string> = {
  sm: 'text-[11px]',
  md: 'text-xs',
}

/** Inline bar width per size preset */
const BAR_WIDTH_CLASS: Record<InlineProgressBarSize, string> = {
  sm: 'w-16',
  md: 'w-24',
}

/**
 * Clamp progress value into 0–100 range
 * @param progress Raw progress value
 * @returns Clamped progress
 */
function clampProgress(progress: number): number {
  return Math.min(100, Math.max(0, progress))
}

/**
 * Render the progress track element
 * @param props Track configuration
 * @returns Progress track element
 */
function ProgressTrack(props: { label: string; trackClass: string; barWidthClass: string; showDeterminate: boolean; clamped: number; inline: boolean }) {
  const { label, trackClass, barWidthClass, showDeterminate, clamped, inline } = props
  const widthClass = inline ? `${barWidthClass} shrink-0` : 'w-full'

  return (
    <div
      className={`overflow-hidden rounded-full bg-gray-200 ${trackClass} ${widthClass}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={showDeterminate ? clamped : undefined}
      aria-label={label}
    >
      {showDeterminate ? (
        <div className={`rounded-full bg-indigo-600 transition-[width] duration-300 ease-out ${trackClass}`} style={{ width: `${clamped}%` }} />
      ) : (
        <div className={`inline-progress-indeterminate w-1/3 rounded-full bg-indigo-600 ${trackClass}`} />
      )}
    </div>
  )
}

/**
 * Inline progress bar with label — no spinner or step counters
 * @param props Progress bar configuration
 * @returns Progress bar element
 */
export function InlineProgressBar(props: InlineProgressBarProps) {
  const { label, progress, indeterminate = progress == null, size = 'sm', layout = 'inline', align = 'start', className = '' } = props
  const trackClass = TRACK_SIZE_CLASS[size]
  const labelClass = LABEL_SIZE_CLASS[size]
  const barWidthClass = BAR_WIDTH_CLASS[size]
  const alignClass = align === 'end' ? 'ml-auto shrink-0 w-auto' : 'min-w-0'
  const rootClass = [alignClass, className].filter(Boolean).join(' ')

  const showDeterminate = !indeterminate && progress != null
  const clamped = showDeterminate ? clampProgress(progress) : 0
  const track = (
    <ProgressTrack label={label} trackClass={trackClass} barWidthClass={barWidthClass} showDeterminate={showDeterminate} clamped={clamped} inline={layout === 'inline'} />
  )

  if (layout === 'stack') {
    return (
      <div className={rootClass}>
        <p className={`truncate font-medium text-gray-700 ${labelClass}`}>{label}</p>
        <div className="mt-1">{track}</div>
      </div>
    )
  }

  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${rootClass}`}>
      <span className={`shrink-0 truncate text-gray-600 ${labelClass}`}>{label}</span>
      {track}
    </div>
  )
}
