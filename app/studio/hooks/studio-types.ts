/**
 * Shared types and defaults for the Studio store
 */
import { DEFAULT_EXTRACTION_SETTINGS, type FrameExtractionSettings } from '@/app/frames/core/types'

/** Canvas display modes */
export type StudioViewMode = 'detail' | 'compare' | 'sprite'

/** Inspector operation tabs */
export type StudioOperationTab = 'remove-background' | 'convert-format' | 'add-text' | 'extract-frames' | 'compose-gif' | 'compose-sprite' | 'export'

/** Per-asset processing status overlay */
export type AssetProcessStatus = 'idle' | 'processing' | 'done' | 'error'

/** Format conversion settings */
export interface ConvertFormatSettings {
  /** Target MIME type */
  format: 'image/png' | 'image/jpeg' | 'image/webp'
  /** Quality for lossy formats (0-1) */
  quality: number
}

/** GIF composition settings */
export interface GifComposeSettings {
  /** Delay between frames in milliseconds */
  intervalMs: number
  /** Whether the animation loops */
  loop: boolean
}

/** Sprite sheet layout settings */
export interface SpriteComposeSettings {
  /** Number of columns in the grid */
  columns: number
  /** Padding between cells in pixels */
  padding: number
}

/** Add text operation settings */
export interface AddTextSettings {
  /** Text content */
  text: string
  /** Font size in pixels */
  fontSize: number
  /** CSS font family */
  fontFamily: string
  /** Text color */
  color: string
  /** Normalized text box left edge (0-1) */
  boxX: number
  /** Normalized text box top edge (0-1) */
  boxY: number
  /** Normalized text box width (0-1) */
  boxWidth: number
  /** Normalized text box height (0-1) */
  boxHeight: number
  /** Font weight */
  fontWeight: 'normal' | 'bold'
  /** How to handle text wider than the text box */
  overflow: 'wrap' | 'clip'
  /** Output format */
  format: 'image/png' | 'image/webp'
  /** Output quality for lossy formats */
  quality: number
}

/** Default format conversion settings */
export const DEFAULT_CONVERT: ConvertFormatSettings = { format: 'image/webp', quality: 0.85 }

/** Default add text settings */
export const DEFAULT_ADD_TEXT: AddTextSettings = {
  text: '',
  fontSize: 48,
  fontFamily: 'sans-serif',
  color: '#ffffff',
  boxX: 0,
  boxY: 0,
  boxWidth: 0,
  boxHeight: 0,
  fontWeight: 'bold',
  overflow: 'wrap',
  format: 'image/png',
  quality: 0.92,
}

/** Default GIF composition settings */
export const DEFAULT_GIF: GifComposeSettings = { intervalMs: 100, loop: true }

/** Default sprite sheet settings */
export const DEFAULT_SPRITE: SpriteComposeSettings = { columns: 8, padding: 2 }

/** Default frame extraction settings (re-export for convenience) */
export const DEFAULT_EXTRACTION: FrameExtractionSettings = DEFAULT_EXTRACTION_SETTINGS
