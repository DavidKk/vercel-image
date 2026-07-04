'use client'

/**
 * Frame extraction inspector operation panel
 */
import { estimateFrameCount } from '@/app/frames/core/frame-scheduler'
import { durationToMs, formatTimeMs, resolveTimeRange } from '@/app/frames/core/time-range'
import type { FrameExtractionSettings } from '@/app/frames/core/types'
import { FormField } from '@/components/FormField'
import { Slider } from '@/components/Slider'
import { TextInput } from '@/components/TextInput'
import { getVideoSource } from '@/lib/studio/asset-helpers'

import { useStudio } from '../../../context/StudioContext'

/**
 * Frame extraction operation panel
 * @returns Operation panel element
 */
export function ExtractFramesOp() {
  const { extractionSettings, setExtractionSettings, selectedAssets, isBusy } = useStudio()
  const videoAsset = selectedAssets.find((asset) => asset.kind === 'video')
  const source = videoAsset ? getVideoSource(videoAsset.id) : undefined
  const resolvedRange = source ? resolveTimeRange(extractionSettings.startInput, extractionSettings.endInput, source.duration) : null
  const estimated = resolvedRange ? estimateFrameCount(resolvedRange, extractionSettings.intervalMs, extractionSettings.maxFrames) : 0

  /**
   * Update a single extraction setting
   * @param key Setting key
   * @param value New value
   */
  function updateSetting<K extends keyof FrameExtractionSettings>(key: K, value: FrameExtractionSettings[K]) {
    setExtractionSettings({ ...extractionSettings, [key]: value })
  }

  return (
    <div className="space-y-3">
      {!videoAsset && <p className="text-xs text-amber-600">Select a video asset to extract frames</p>}
      {videoAsset && source && (
        <p className="text-xs text-[var(--studio-surface-fg-muted)]">
          {videoAsset.name} · {formatTimeMs(durationToMs(source.duration))}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <FormField id="start-ms" label="Start (ms)">
          <TextInput id="start-ms" value={extractionSettings.startInput} onChange={(startInput) => updateSetting('startInput', startInput)} disabled={!videoAsset || isBusy} />
        </FormField>
        <FormField id="end-ms" label="End (ms)">
          <TextInput
            id="end-ms"
            value={extractionSettings.endInput}
            onChange={(endInput) => updateSetting('endInput', endInput)}
            placeholder="0 = end"
            disabled={!videoAsset || isBusy}
          />
        </FormField>
      </div>

      <p className="text-[10px] text-[var(--studio-surface-fg-subtle)]">Negative values count from the end (e.g. -10000 = last 10 seconds)</p>

      {resolvedRange && (
        <p className="text-xs text-[var(--studio-accent)]">
          Range: {formatTimeMs(resolvedRange.start)} → {formatTimeMs(resolvedRange.end)} · ~{estimated} frames
        </p>
      )}

      <FormField id="interval" label={`Interval: ${extractionSettings.intervalMs}ms`}>
        <Slider
          id="interval"
          min={33}
          max={2000}
          step={33}
          value={extractionSettings.intervalMs}
          onChange={(intervalMs) => updateSetting('intervalMs', intervalMs)}
          disabled={!videoAsset || isBusy}
        />
      </FormField>

      <FormField id="max-frames" label={`Max frames: ${extractionSettings.maxFrames}`}>
        <Slider
          id="max-frames"
          min={10}
          max={500}
          step={10}
          value={extractionSettings.maxFrames}
          onChange={(maxFrames) => updateSetting('maxFrames', maxFrames)}
          disabled={!videoAsset || isBusy}
        />
      </FormField>
    </div>
  )
}
