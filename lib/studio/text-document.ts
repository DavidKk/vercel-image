/**
 * Text document model: image + editable text layer stored as intermediate project data
 */
import { blobToImage, canvasToBlob } from '@/lib/image/canvas'

import { type AddTextConfig, buildTextFont, drawTextInBox, hasTextBox, textBoxToPixels } from './operations/add-text'
import type { StudioAsset, StudioAssetInput } from './types'

/** MIME type for persisted text document assets */
export const TEXT_DOCUMENT_MIME = 'application/vnd.studio.text-document+json'

/** File extension shown in the library */
export const TEXT_DOCUMENT_EXTENSION = '.studio-text'

/** Editable text layer within a text document */
export interface TextLayer {
  /** Layer text content */
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
  overflow?: 'wrap' | 'clip'
  /** Legacy center anchor X for migration */
  x?: number
  /** Legacy center anchor Y for migration */
  y?: number
  /** Legacy width ratio for migration */
  boxWidthRatio?: number
}

/** Export defaults stored with the document */
export interface TextDocumentExportSettings {
  /** Output MIME type used when flattening on export */
  format: 'image/png' | 'image/webp'
  /** Output quality for lossy formats */
  quality: number
}

/** Serialized text document payload stored in the asset blob */
export interface TextDocumentContent {
  /** Schema version */
  version: 1
  /** Editable text layer */
  layer: TextLayer
  /** Flatten settings applied on export */
  export: TextDocumentExportSettings
}

/**
 * Whether an asset is a persisted text document project
 * @param asset Studio asset
 * @returns True for text document assets
 */
export function isTextDocumentAsset(asset: StudioAsset): boolean {
  return asset.kind === 'text-document' || asset.mimeType === TEXT_DOCUMENT_MIME
}

/**
 * Parse a text document asset blob
 * @param asset Text document asset
 * @returns Parsed content or null when invalid
 */
export async function parseTextDocument(asset: StudioAsset): Promise<TextDocumentContent | null> {
  if (!isTextDocumentAsset(asset)) return null
  try {
    const raw = await asset.blob.text()
    const parsed = JSON.parse(raw) as TextDocumentContent
    if (parsed?.version !== 1 || !parsed.layer) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Serialize text document content to a blob
 * @param content Document payload
 * @returns JSON blob
 */
export function serializeTextDocument(content: TextDocumentContent): Blob {
  return new Blob([JSON.stringify(content)], { type: TEXT_DOCUMENT_MIME })
}

/**
 * Migrate a legacy text layer to the box-based model
 * @param layer Parsed text layer
 * @returns Normalized box fields
 */
function migrateLegacyTextLayer(layer: TextLayer): Pick<AddTextConfig, 'boxX' | 'boxY' | 'boxWidth' | 'boxHeight'> {
  if (layer.boxWidth > 0 && layer.boxHeight > 0) {
    return {
      boxX: layer.boxX,
      boxY: layer.boxY,
      boxWidth: layer.boxWidth,
      boxHeight: layer.boxHeight,
    }
  }

  const legacyWidth = layer.boxWidthRatio ?? 0
  const legacyX = layer.x
  const legacyY = layer.y
  if (legacyWidth > 0 && legacyX != null && legacyY != null) {
    const boxHeight = Math.max(legacyWidth * 0.35, 0.04)
    return {
      boxX: Math.max(0, legacyX - legacyWidth / 2),
      boxY: Math.max(0, legacyY - boxHeight / 2),
      boxWidth: legacyWidth,
      boxHeight,
    }
  }

  return { boxX: 0, boxY: 0, boxWidth: 0, boxHeight: 0 }
}

/**
 * Build document content from add-text UI settings
 * @param settings Current add-text settings
 * @returns Serializable document payload
 */
export function buildTextDocumentContent(settings: AddTextConfig): TextDocumentContent {
  return {
    version: 1,
    layer: {
      text: settings.text,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      color: settings.color,
      boxX: settings.boxX,
      boxY: settings.boxY,
      boxWidth: settings.boxWidth,
      boxHeight: settings.boxHeight,
      fontWeight: settings.fontWeight,
      overflow: settings.overflow,
    },
    export: {
      format: settings.format,
      quality: settings.quality,
    },
  }
}

/**
 * Convert a text layer and export settings into add-text UI settings
 * @param content Parsed document content
 * @returns Add-text settings for the editor
 */
export function textDocumentToAddTextSettings(content: TextDocumentContent): AddTextConfig {
  const box = migrateLegacyTextLayer(content.layer)
  return {
    text: content.layer.text,
    fontSize: content.layer.fontSize,
    fontFamily: content.layer.fontFamily,
    color: content.layer.color,
    fontWeight: content.layer.fontWeight,
    overflow: content.layer.overflow ?? 'wrap',
    ...box,
    format: content.export.format,
    quality: content.export.quality,
  }
}

/**
 * Resolve the base image asset for a text document
 * @param document Text document asset
 * @param assets All loaded assets
 * @returns Base image asset or undefined
 */
export function getTextDocumentBaseAsset(document: StudioAsset, assets: StudioAsset[]): StudioAsset | undefined {
  if (!document.parentId) return undefined
  return assets.find((asset) => asset.id === document.parentId)
}

/**
 * Build a new text document asset input from a base image and editor settings
 * @param baseAsset Source image asset
 * @param settings Current add-text settings
 * @returns Asset input for persistence
 */
export function buildTextDocumentInput(baseAsset: StudioAsset, settings: AddTextConfig): StudioAssetInput {
  const content = buildTextDocumentContent(settings)
  const blob = serializeTextDocument(content)
  const baseName = baseAsset.name.replace(/\.[^.]+$/, '')

  return {
    name: `${baseName}${TEXT_DOCUMENT_EXTENSION}`,
    kind: 'text-document',
    source: 'text-document',
    mimeType: TEXT_DOCUMENT_MIME,
    blob,
    width: baseAsset.width,
    height: baseAsset.height,
    size: blob.size,
    parentId: baseAsset.id,
  }
}

/**
 * Flatten a text document onto its base image for preview or export
 * @param baseAsset Base image asset
 * @param content Text document content
 * @returns Flattened image blob
 */
export async function renderTextDocument(baseAsset: StudioAsset, content: TextDocumentContent): Promise<Blob> {
  const img = await blobToImage(baseAsset.blob)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  ctx.drawImage(img, 0, 0)

  const settings = textDocumentToAddTextSettings(content)
  const trimmed = settings.text.trim()
  if (trimmed && hasTextBox(settings)) {
    ctx.font = buildTextFont(settings.fontWeight, settings.fontSize, settings.fontFamily)
    const rect = textBoxToPixels(settings.boxX, settings.boxY, settings.boxWidth, settings.boxHeight, canvas.width, canvas.height)
    drawTextInBox(ctx, trimmed, rect, settings.fontSize, settings.color, settings.overflow)
  }

  return canvasToBlob(canvas, content.export.format, content.export.quality)
}

/**
 * Resolve export filename for a flattened text document
 * @param document Text document asset
 * @returns Download filename with image extension
 */
export function getTextDocumentExportName(document: StudioAsset, format: 'image/png' | 'image/webp'): string {
  const baseName = document.name.replace(/\.[^.]+$/, '').replace(/\.studio-text$/, '')
  const ext = format.split('/')[1]
  return `${baseName}.${ext}`
}

/**
 * Resolve export blob and filename for any asset (flattens text documents)
 * @param asset Asset to export
 * @param assets All loaded assets for resolving document parents
 * @returns Export blob and filename
 */
export async function resolveAssetExport(asset: StudioAsset, assets: StudioAsset[]): Promise<{ blob: Blob; filename: string }> {
  if (!isTextDocumentAsset(asset)) {
    return { blob: asset.blob, filename: asset.name }
  }

  const content = await parseTextDocument(asset)
  const baseAsset = getTextDocumentBaseAsset(asset, assets)
  if (!content || !baseAsset) {
    return { blob: asset.blob, filename: asset.name }
  }

  const blob = await renderTextDocument(baseAsset, content)
  return {
    blob,
    filename: getTextDocumentExportName(asset, content.export.format),
  }
}
