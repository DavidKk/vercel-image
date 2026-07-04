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
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-studio-lg border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] px-8 py-10 shadow-studio-sm">
        <Spinner className="h-7 w-7" color="text-[var(--studio-surface-fg-subtle)]" />
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--studio-surface-fg-subtle)]">Loading</p>
        <p className="break-all text-center text-sm font-medium text-[var(--studio-surface-fg)]">{name}</p>
        <InlineProgressBar label={statusLabel} progress={progress} indeterminate={indeterminate} layout="stack" size="md" align="start" className="w-full" />
      </div>
    </div>
  )
}
