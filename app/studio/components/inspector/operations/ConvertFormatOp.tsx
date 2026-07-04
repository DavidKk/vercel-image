'use client'

/**
 * Format conversion inspector operation panel
 */
import { FormField } from '@/components/FormField'
import { Select } from '@/components/Select'
import { Slider } from '@/components/Slider'

import { useStudio } from '../../../context/StudioContext'

const FORMAT_OPTIONS = [
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
]

/**
 * Format conversion operation panel
 * @returns Operation panel element
 */
export function ConvertFormatOp() {
  const { convertSettings, setConvertSettings, isBusy } = useStudio()

  return (
    <div className="space-y-3">
      <FormField id="convert-format" label="Target Format">
        <Select
          id="convert-format"
          value={convertSettings.format}
          onChange={(format) => setConvertSettings({ ...convertSettings, format: format as typeof convertSettings.format })}
          options={FORMAT_OPTIONS}
          disabled={isBusy}
        />
      </FormField>

      {(convertSettings.format === 'image/jpeg' || convertSettings.format === 'image/webp') && (
        <FormField id="convert-quality" label={`Quality: ${Math.round(convertSettings.quality * 100)}%`}>
          <Slider
            id="convert-quality"
            min={0.1}
            max={1}
            step={0.05}
            value={convertSettings.quality}
            onChange={(quality) => setConvertSettings({ ...convertSettings, quality })}
            disabled={isBusy}
          />
        </FormField>
      )}
    </div>
  )
}
