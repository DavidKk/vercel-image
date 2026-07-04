'use client'

/**
 * Sprite sheet composition inspector operation panel
 */
import { FormField } from '@/components/FormField'
import { Slider } from '@/components/Slider'

import { useStudio } from '../../../context/StudioContext'

/**
 * Sprite sheet composition operation panel
 * @returns Operation panel element
 */
export function ComposeSpriteOp() {
  const { spriteSettings, setSpriteSettings, isBusy } = useStudio()

  return (
    <div className="space-y-3">
      <FormField id="sprite-cols" label={`Columns: ${spriteSettings.columns}`}>
        <Slider
          id="sprite-cols"
          min={1}
          max={16}
          step={1}
          value={spriteSettings.columns}
          onChange={(columns) => setSpriteSettings({ ...spriteSettings, columns })}
          disabled={isBusy}
        />
      </FormField>

      <FormField id="sprite-pad" label={`Padding: ${spriteSettings.padding}px`}>
        <Slider
          id="sprite-pad"
          min={0}
          max={16}
          step={1}
          value={spriteSettings.padding}
          onChange={(padding) => setSpriteSettings({ ...spriteSettings, padding })}
          disabled={isBusy}
        />
      </FormField>
    </div>
  )
}
