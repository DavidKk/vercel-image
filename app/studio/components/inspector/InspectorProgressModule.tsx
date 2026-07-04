'use client'

/**
 * Right-aligned operation progress and recent job status for the inspector
 */
import { InlineProgressBar } from '@/components/InlineProgressBar'

import { useStudio } from '../../context/StudioContext'

/** Maximum recent job chips to show */
const MAX_RECENT_JOBS = 3

/**
 * Compact job status label for display
 * @param type Job operation type
 * @returns Human-readable type label
 */
function formatJobType(type: string): string {
  switch (type) {
    case 'removeBackground':
      return 'Remove BG'
    case 'convertFormat':
      return 'Convert'
    case 'extractFrames':
      return 'Frames'
    case 'composeGif':
      return 'GIF'
    case 'composeSprite':
      return 'Sprite'
    default:
      return type
  }
}

/**
 * Inspector footer progress module: running task, model load, and recent completions
 * @returns Progress module element or null
 */
export function InspectorProgressModule() {
  const { isModelInitializing, modelProgress, runningJob, jobs } = useStudio()

  const recentJobs = jobs
    .slice(-MAX_RECENT_JOBS * 2)
    .reverse()
    .filter((job) => !(runningJob && job.id === runningJob.id))
    .slice(0, MAX_RECENT_JOBS)

  const showRunningProgress = runningJob != null
  const showModelProgress = isModelInitializing && !runningJob
  const showRecentJobs = recentJobs.length > 0

  if (!showRunningProgress && !showModelProgress && !showRecentJobs) return null

  const progressLabel = runningJob?.message ?? 'Loading AI model...'
  const progressValue = runningJob?.progress ?? modelProgress.progress
  const progressIndeterminate = showModelProgress && progressValue <= 0

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5 border-t border-[var(--studio-surface-border)] px-3 py-2">
      {showRunningProgress || showModelProgress ? (
        <InlineProgressBar align="end" label={progressLabel} progress={progressIndeterminate ? undefined : progressValue} indeterminate={progressIndeterminate} size="sm" />
      ) : null}

      {showRecentJobs ? (
        <div className="flex max-w-full flex-wrap justify-end gap-1">
          {recentJobs.map((job) => (
            <span
              key={job.id}
              className={`shrink-0 rounded px-2 py-0.5 text-[10px] ${
                job.status === 'done'
                  ? 'bg-[var(--studio-success-muted)] text-[var(--studio-success-fg)]'
                  : job.status === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-[var(--studio-surface-subtle)] text-[var(--studio-surface-fg-muted)]'
              }`}
            >
              {formatJobType(job.type)} · {job.status}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
