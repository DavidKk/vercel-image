'use client'

/**
 * GIF composition inspector operation panel
 */
import { Checkbox } from '@/components/Checkbox'
import { FormField } from '@/components/FormField'
import { Slider } from '@/components/Slider'

import { useStudio } from '../../../context/StudioContext'

/**
 * GIF composition operation panel
 * @returns Operation panel element
 */
export function ComposeGifOp() {
  const { gifSettings, setGifSettings, isBusy } = useStudio()

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--studio-surface-fg-muted)]">Select frame images (sorted by timestamp metadata)</p>

      <FormField id="gif-interval" label={`Frame interval: ${gifSettings.intervalMs}ms`}>
        <Slider
          id="gif-interval"
          min={33}
          max={2000}
          step={33}
          value={gifSettings.intervalMs}
          onChange={(intervalMs) => setGifSettings({ ...gifSettings, intervalMs })}
          disabled={isBusy}
        />
      </FormField>

      <Checkbox
        id="gif-loop"
        checked={gifSettings.loop}
        onChange={(loop) => setGifSettings({ ...gifSettings, loop })}
        disabled={isBusy}
        label="Loop animation"
        className="text-xs text-[var(--studio-surface-fg)]"
      />
    </div>
  )
}
