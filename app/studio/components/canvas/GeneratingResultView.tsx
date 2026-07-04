'use client'

/**
 * Canvas placeholder while a pending result asset is being generated
 */
import { InlineProgressBar } from '@/components/InlineProgressBar'
import { Spinner } from '@/components/Spinner'

interface GeneratingResultViewProps {
  /** Asset display name */
  name: string
  /** Short status line (e.g. "Composing GIF…") */
  statusLabel: string
  /** Job progress 0–100 when available */
  progress?: number
}

/**
 * Full-canvas loading state for a pending output asset
 * @param props Component props
 * @returns Generating result view element
 */
export function GeneratingResultView(props: GeneratingResultViewProps) {
  const { name, statusLabel, progress } = props
  const indeterminate = progress == null

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
        <Spinner className="h-7 w-7" color="text-gray-400" />
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Loading</p>
        <p className="text-center text-sm font-medium text-gray-800 break-all">{name}</p>
        <InlineProgressBar label={statusLabel} progress={progress} indeterminate={indeterminate} layout="stack" size="md" align="start" className="w-full" />
      </div>
    </div>
  )
}
