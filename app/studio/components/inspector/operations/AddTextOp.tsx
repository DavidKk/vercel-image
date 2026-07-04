'use client'

/**
 * Add text overlay inspector operation panel
 */
import { FormField } from '@/components/FormField'
import { Select } from '@/components/Select'
import { Slider } from '@/components/Slider'
import { TextInput } from '@/components/TextInput'

import { useStudio } from '../../../context/StudioContext'

const FONT_OPTIONS = [
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Impact, sans-serif', label: 'Impact' },
]

const FORMAT_OPTIONS = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
]

const WEIGHT_OPTIONS = [
  { value: 'bold', label: 'Bold' },
  { value: 'normal', label: 'Normal' },
]

const OVERFLOW_OPTIONS = [
  { value: 'wrap', label: 'Wrap' },
  { value: 'clip', label: 'Clip' },
]

const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 160

/**
 * Clamp font size to supported range
 * @param fontSize Requested font size in pixels
 * @returns Clamped font size
 */
function clampFontSize(fontSize: number): number {
  if (!Number.isFinite(fontSize)) return MIN_FONT_SIZE
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(fontSize)))
}

/**
 * Add text operation panel
 * @returns Operation panel element
 */
export function AddTextOp() {
  const { addTextSettings, setAddTextSettings, isBusy } = useStudio()

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--studio-surface-fg-muted)]">
        Drag on the preview to draw a text box, then type inside it. Drag edges to resize. Changes save automatically.
      </p>

      <FormField id="add-text-font" label="Font">
        <Select
          id="add-text-font"
          value={addTextSettings.fontFamily}
          onChange={(fontFamily) => setAddTextSettings((prev) => ({ ...prev, fontFamily }))}
          options={FONT_OPTIONS}
          disabled={isBusy}
        />
      </FormField>

      <FormField id="add-text-weight" label="Weight">
        <Select
          id="add-text-weight"
          value={addTextSettings.fontWeight}
          onChange={(fontWeight) => setAddTextSettings((prev) => ({ ...prev, fontWeight: fontWeight as 'normal' | 'bold' }))}
          options={WEIGHT_OPTIONS}
          disabled={isBusy}
        />
      </FormField>

      <FormField id="add-text-size" label="Size">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <Slider
              id="add-text-size-slider"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={1}
              value={addTextSettings.fontSize}
              onChange={(fontSize) => setAddTextSettings((prev) => ({ ...prev, fontSize: clampFontSize(fontSize) }))}
              disabled={isBusy}
            />
          </div>
          <TextInput
            id="add-text-size"
            value={String(addTextSettings.fontSize)}
            onChange={(value) => setAddTextSettings((prev) => ({ ...prev, fontSize: clampFontSize(Number(value)) }))}
            disabled={isBusy}
            className="w-16 shrink-0 text-center"
          />
        </div>
      </FormField>

      <FormField id="add-text-overflow" label="Overflow">
        <Select
          id="add-text-overflow"
          value={addTextSettings.overflow}
          onChange={(overflow) => setAddTextSettings((prev) => ({ ...prev, overflow: overflow as 'wrap' | 'clip' }))}
          options={OVERFLOW_OPTIONS}
          disabled={isBusy}
        />
      </FormField>

      <FormField id="add-text-color" label="Color">
        <div className="flex items-center gap-2">
          <input
            id="add-text-color"
            type="color"
            value={addTextSettings.color}
            onChange={(event) => setAddTextSettings((prev) => ({ ...prev, color: event.target.value }))}
            disabled={isBusy}
            className="h-9 w-12 cursor-pointer rounded-studio-md border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <TextInput
            value={addTextSettings.color}
            onChange={(color) => setAddTextSettings((prev) => ({ ...prev, color }))}
            disabled={isBusy}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </FormField>

      <FormField id="add-text-format" label="Output Format">
        <Select
          id="add-text-format"
          value={addTextSettings.format}
          onChange={(format) => setAddTextSettings((prev) => ({ ...prev, format: format as typeof addTextSettings.format }))}
          options={FORMAT_OPTIONS}
          disabled={isBusy}
        />
      </FormField>

      {addTextSettings.format === 'image/webp' && (
        <FormField id="add-text-quality" label={`Quality: ${Math.round(addTextSettings.quality * 100)}%`}>
          <Slider
            id="add-text-quality"
            min={0.1}
            max={1}
            step={0.05}
            value={addTextSettings.quality}
            onChange={(quality) => setAddTextSettings((prev) => ({ ...prev, quality }))}
            disabled={isBusy}
          />
        </FormField>
      )}
    </div>
  )
}
