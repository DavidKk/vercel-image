'use client'

import { Checkbox } from '@/components/Checkbox'
import { FormField } from '@/components/FormField'
import { Select } from '@/components/Select'
import { Slider } from '@/components/Slider'

import {
  type BackgroundRemovalModel,
  type BackgroundRemovalUserConfig,
  DEFAULT_BACKGROUND_REMOVAL_CONFIG,
  getPublicPathFromEnv,
  MODE_OPTIONS,
  MODEL_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  type OutputFormat,
  type ProcessingDevice,
  type ProcessingMode,
} from '../core/model-config'

interface ProcessingSettingsProps {
  /** Current configuration */
  config: BackgroundRemovalUserConfig
  /** Called when any setting changes */
  onChange: (config: BackgroundRemovalUserConfig) => void
  /** Called when user clicks reset to defaults */
  onReset?: () => void | Promise<void>
  /** Whether controls are disabled */
  disabled?: boolean
  /** Whether model needs reload after config change */
  needsModelReload?: boolean
  /** Called when user clicks reload model */
  onReloadModel?: () => void
  /** Whether model is currently reloading */
  isReloading?: boolean
  /** Show inline reset button (Studio uses footer reset instead) */
  showReset?: boolean
}

const DEVICE_OPTIONS = [
  { value: 'cpu', label: 'CPU' },
  { value: 'gpu', label: 'GPU (WebGPU)' },
]

/**
 * Settings panel for @imgly/background-removal configuration
 * @param props Component props
 * @returns Settings panel element
 */
export function ProcessingSettings(props: ProcessingSettingsProps) {
  const { config, onChange, onReset, disabled, needsModelReload, onReloadModel, isReloading, showReset = true } = props
  const publicPath = getPublicPathFromEnv()

  const supportsQuality = config.outputFormat === 'image/jpeg' || config.outputFormat === 'image/webp'

  /**
   * Update a single config field
   * @param patch Partial config update
   */
  function update(patch: Partial<BackgroundRemovalUserConfig>) {
    onChange({ ...config, ...patch })
  }

  return (
    <div className="space-y-3 border-t border-gray-100 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">AI Settings</h3>
        {needsModelReload && onReloadModel && (
          <button
            type="button"
            onClick={onReloadModel}
            disabled={disabled || isReloading}
            className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            {isReloading ? 'Reloading...' : 'Reload Model'}
          </button>
        )}
      </div>

      <FormField id="processing-mode" label="Mode" hint={MODE_OPTIONS.find((option) => option.value === config.mode)?.description}>
        <Select
          id="processing-mode"
          value={config.mode}
          onChange={(mode) => update({ mode: mode as ProcessingMode })}
          options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          disabled={disabled}
        />
      </FormField>

      <FormField id="model-select" label="Model" hint={MODEL_OPTIONS.find((option) => option.value === config.model)?.description}>
        <Select
          id="model-select"
          value={config.model}
          onChange={(model) => update({ model: model as BackgroundRemovalModel })}
          options={MODEL_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          disabled={disabled}
        />
      </FormField>

      <FormField id="device-select" label="Device" hint="GPU requires WebGPU support in browser">
        <Select id="device-select" value={config.device} onChange={(device) => update({ device: device as ProcessingDevice })} options={DEVICE_OPTIONS} disabled={disabled} />
      </FormField>

      <FormField id="output-format" label="Output Format">
        <Select
          id="output-format"
          value={config.outputFormat}
          onChange={(outputFormat) => update({ outputFormat: outputFormat as OutputFormat })}
          options={OUTPUT_FORMAT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          disabled={disabled}
        />
      </FormField>

      {supportsQuality && (
        <FormField id="output-quality" label={`Output Quality: ${Math.round(config.outputQuality * 100)}%`}>
          <Slider id="output-quality" min={0.1} max={1} step={0.05} value={config.outputQuality} onChange={(outputQuality) => update({ outputQuality })} disabled={disabled} />
        </FormField>
      )}

      <FormField id="edge-smooth" label={`Edge Smooth: ${config.edgeSmooth}`}>
        <Slider id="edge-smooth" min={0} max={3} step={1} value={config.edgeSmooth} onChange={(edgeSmooth) => update({ edgeSmooth })} disabled={disabled} />
      </FormField>

      <FormField id="edge-feather" label={`Edge Feather: ${config.edgeFeather}`}>
        <Slider id="edge-feather" min={0} max={3} step={1} value={config.edgeFeather} onChange={(edgeFeather) => update({ edgeFeather })} disabled={disabled} />
      </FormField>

      <div className="space-y-3">
        <Checkbox checked={config.rescale} onChange={(rescale) => update({ rescale })} disabled={disabled} label="Rescale large images" className="text-xs text-gray-700" />
        <Checkbox
          checked={config.proxyToWorker}
          onChange={(proxyToWorker) => update({ proxyToWorker })}
          disabled={disabled}
          label="Library internal worker"
          className="text-xs text-gray-700"
        />
        <Checkbox checked={config.debug} onChange={(debug) => update({ debug })} disabled={disabled} label="Debug logging" className="text-xs text-gray-700" />
      </div>

      {publicPath && (
        <p className="break-all text-[10px] text-gray-400">
          Model CDN: <span className="font-mono">{publicPath}</span>
        </p>
      )}

      {showReset ? (
        <button
          type="button"
          onClick={() => (onReset ? onReset() : onChange({ ...DEFAULT_BACKGROUND_REMOVAL_CONFIG }))}
          disabled={disabled}
          className="w-full py-1 text-xs text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
        >
          Reset to defaults
        </button>
      ) : null}
    </div>
  )
}
