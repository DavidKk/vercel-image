'use client'

/**
 * Zone A: editor chrome top bar (sole app header)
 */
import { useCallback } from 'react'
import { FiGithub } from 'react-icons/fi'

import { useConfirm } from '@/components/confirm-dialog'
import packageJson from '@/package.json'

import { useStudio } from '../../context/StudioContext'
import type { StudioViewMode } from '../../hooks/studio-types'

/** View mode buttons */
const VIEW_MODES: { value: StudioViewMode; label: string }[] = [
  { value: 'detail', label: 'Detail' },
  { value: 'compare', label: 'Compare' },
  { value: 'sprite', label: 'Sprite' },
]

const GITHUB_URL = packageJson.repository?.url

/**
 * Studio editor top bar
 * @returns Editor header element
 */
export function TopBar() {
  const { viewMode, setViewMode, assets, removeAll, isBusy, primarySelected, parentAsset } = useStudio()
  const { confirm } = useConfirm()

  const canCompare = primarySelected && parentAsset

  const handleClearAll = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Clear library',
      message: `Remove all ${assets.length} asset${assets.length === 1 ? '' : 's'} from the library? This cannot be undone.`,
      confirmLabel: 'Clear all',
      destructive: true,
    })
    if (confirmed) await removeAll()
  }, [assets.length, confirm, removeAll])

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--studio-chrome-border)] bg-[var(--studio-chrome)] px-3 text-zinc-100">
      <div className="flex min-w-0 items-center gap-2.5 border-r border-[var(--studio-chrome-border)] pr-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500 text-[10px] font-bold text-white" aria-hidden>
          S
        </div>
        <span className="truncate text-sm font-semibold tracking-tight">Studio</span>
      </div>

      <div className="flex flex-1 justify-center">
        <div className="flex items-center gap-0.5 rounded-md bg-zinc-900 p-0.5 ring-1 ring-zinc-800">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setViewMode(mode.value)}
              disabled={mode.value === 'compare' && !canCompare}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                viewMode === mode.value ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-l border-[var(--studio-chrome-border)] pl-3">
        <button
          type="button"
          onClick={() => void handleClearAll()}
          disabled={isBusy || assets.length === 0}
          className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
        >
          Clear
        </button>
        {GITHUB_URL ? (
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="GitHub repository"
          >
            <FiGithub className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </header>
  )
}
