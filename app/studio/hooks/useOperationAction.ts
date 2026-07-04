'use client'

/**
 * Resolve run action for the active Studio operation tab
 */
import { useMemo } from 'react'

import { estimateFrameCount } from '@/app/frames/core/frame-scheduler'
import { resolveTimeRange } from '@/app/frames/core/time-range'
import { getProcessingModeLabel } from '@/app/progress/core/model-config'
import { getVideoSource, isGifAsset, isStaticImageAsset } from '@/lib/studio/asset-helpers'

import { useStudio } from '../context/StudioContext'
import { DEFAULT_CONVERT, DEFAULT_EXTRACTION, DEFAULT_GIF, DEFAULT_SPRITE, type StudioOperationTab } from './studio-types'

/** Resolved operation action for inspector footer */
export interface OperationAction {
  /** Primary submit button label */
  label: string
  /** Tooltip describing what submit will do */
  submitTooltip: string
  /** Whether the action can run now */
  canRun: boolean
  /** Execute the active operation */
  run: () => void | Promise<void>
  /** Reset panel settings to defaults */
  reset?: () => void | Promise<void>
  /** Whether reset is available now */
  canReset: boolean
  /** Tooltip for the reset control */
  resetTooltip: string
}

/**
 * Build run action state for the active operation tab
 * @param activeTab Active operation tab
 * @returns Operation action metadata
 */
export function useOperationAction(activeTab: StudioOperationTab): OperationAction {
  const {
    assets,
    selectedAssets,
    isBusy,
    isModelInitializing,
    autoSegmentSupported,
    extractionSettings,
    runRemoveBackground,
    runConvertFormat,
    runExtractFrames,
    runComposeGif,
    runComposeSprite,
    exportSelected,
    processingConfig,
    handleResetConfig,
    setConvertSettings,
    setExtractionSettings,
    setGifSettings,
    setSpriteSettings,
  } = useStudio()

  return useMemo(() => {
    const imageAssets = selectedAssets.filter(isStaticImageAsset)
    const gifAssets = selectedAssets.filter(isGifAsset)
    const aiTargets = imageAssets.length + gifAssets.length
    const videoAsset = selectedAssets.find((asset) => asset.kind === 'video')
    const videoSource = videoAsset ? getVideoSource(videoAsset.id) : undefined
    const resolvedRange = videoSource ? resolveTimeRange(extractionSettings.startInput, extractionSettings.endInput, videoSource.duration) : null
    const estimatedFrames = resolvedRange ? estimateFrameCount(resolvedRange, extractionSettings.intervalMs, extractionSettings.maxFrames) : 0

    switch (activeTab) {
      case 'remove-background':
        return {
          label: 'Submit',
          submitTooltip: `${getProcessingModeLabel(processingConfig.mode)} (${aiTargets})`,
          canRun: !isBusy && !isModelInitializing && aiTargets > 0 && autoSegmentSupported,
          run: runRemoveBackground,
          reset: handleResetConfig,
          canReset: !isBusy && !isModelInitializing,
          resetTooltip: 'Reset to defaults',
        }
      case 'convert-format':
        return {
          label: 'Submit',
          submitTooltip: `Convert format (${imageAssets.length})`,
          canRun: !isBusy && imageAssets.length > 0,
          run: runConvertFormat,
          reset: () => setConvertSettings(DEFAULT_CONVERT),
          canReset: !isBusy,
          resetTooltip: 'Reset to defaults',
        }
      case 'extract-frames':
        return {
          label: 'Submit',
          submitTooltip: `Extract frames (~${estimatedFrames})`,
          canRun: !isBusy && Boolean(videoAsset) && estimatedFrames > 0,
          run: runExtractFrames,
          reset: () => setExtractionSettings(DEFAULT_EXTRACTION),
          canReset: !isBusy,
          resetTooltip: 'Reset to defaults',
        }
      case 'compose-gif':
        return {
          label: 'Submit',
          submitTooltip: `Compose GIF (${imageAssets.length})`,
          canRun: !isBusy && imageAssets.length >= 2,
          run: runComposeGif,
          reset: () => setGifSettings(DEFAULT_GIF),
          canReset: !isBusy,
          resetTooltip: 'Reset to defaults',
        }
      case 'compose-sprite':
        return {
          label: 'Submit',
          submitTooltip: `Compose sprite (${imageAssets.length})`,
          canRun: !isBusy && imageAssets.length > 0,
          run: runComposeSprite,
          reset: () => setSpriteSettings(DEFAULT_SPRITE),
          canReset: !isBusy,
          resetTooltip: 'Reset to defaults',
        }
      case 'export':
        return {
          label: 'Submit',
          submitTooltip: `Export ZIP (${selectedAssets.length > 0 ? selectedAssets.length : assets.length})`,
          canRun: !isBusy && assets.length > 0,
          run: exportSelected,
          canReset: false,
          resetTooltip: 'Reset to defaults',
        }
      default:
        return {
          label: 'Submit',
          submitTooltip: 'Submit',
          canRun: false,
          run: () => {},
          canReset: false,
          resetTooltip: 'Reset to defaults',
        }
    }
  }, [
    activeTab,
    assets.length,
    autoSegmentSupported,
    exportSelected,
    extractionSettings.endInput,
    extractionSettings.intervalMs,
    extractionSettings.maxFrames,
    extractionSettings.startInput,
    handleResetConfig,
    isBusy,
    isModelInitializing,
    processingConfig.mode,
    runComposeGif,
    runComposeSprite,
    runConvertFormat,
    runExtractFrames,
    runRemoveBackground,
    selectedAssets,
    setConvertSettings,
    setExtractionSettings,
    setGifSettings,
    setSpriteSettings,
  ])
}
