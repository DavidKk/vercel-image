/**
 * Add text overlay operation: draw text onto a source image via canvas
 */
import { blobToImage, canvasToBlob } from '@/lib/image/canvas'

import type { StudioAsset, StudioAssetInput } from '../types'

/** Text overlay settings */
export interface AddTextConfig {
  /** Text content (supports multiple lines) */
  text: string
  /** Font size in pixels */
  fontSize: number
  /** CSS font family */
  fontFamily: string
  /** Text fill color */
  color: string
  /** Normalized text box left edge (0-1); 0 width/height means not placed */
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
  /** Output MIME type */
  format: 'image/png' | 'image/webp'
  /** Output quality for lossy formats */
  quality: number
}

/** Rectangle in image pixel space */
export interface TextBoxRect {
  /** Left edge in image pixels */
  left: number
  /** Top edge in image pixels */
  top: number
  /** Width in image pixels */
  width: number
  /** Height in image pixels */
  height: number
}

/** Edge of a text box used for resize hit-testing */
export type TextBoxEdge = 'top' | 'right' | 'bottom' | 'left'

/**
 * Whether add-text settings define a placed text box
 * @param config Add-text settings
 * @returns True when a box has been drawn
 */
export function hasTextBox(config: Pick<AddTextConfig, 'boxWidth' | 'boxHeight'>): boolean {
  return config.boxWidth > 0 && config.boxHeight > 0
}

/**
 * Build a canvas font string from text style settings
 * @param fontWeight Font weight
 * @param fontSize Font size in pixels
 * @param fontFamily CSS font family
 * @returns Canvas font string
 */
export function buildTextFont(fontWeight: string, fontSize: number, fontFamily: string): string {
  return `${fontWeight} ${fontSize}px ${fontFamily}`
}

/**
 * Bounding box of rendered text in image pixel space
 */
export interface TextBounds {
  /** Left edge in image pixels */
  left: number
  /** Top edge in image pixels */
  top: number
  /** Right edge in image pixels */
  right: number
  /** Bottom edge in image pixels */
  bottom: number
  /** Bounding width in image pixels */
  width: number
  /** Bounding height in image pixels */
  height: number
}

/**
 * Wrap a single logical line to fit within a maximum width
 * @param ctx Canvas 2D context with font already set
 * @param line Logical line text
 * @param maxWidth Maximum line width in image pixels
 * @returns Wrapped display lines
 */
function wrapLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string[] {
  if (!line) return ['']
  if (maxWidth <= 0 || ctx.measureText(line).width <= maxWidth) return [line]

  const result: string[] = []
  const words = line.split(/(\s+)/)
  let current = ''

  const pushChars = (chunk: string) => {
    for (const char of chunk) {
      const next = current + char
      if (current && ctx.measureText(next).width > maxWidth) {
        result.push(current)
        current = char
      } else {
        current = next
      }
    }
  }

  for (const word of words) {
    if (!word) continue
    const candidate = current + word
    if (current && ctx.measureText(candidate).width > maxWidth) {
      if (ctx.measureText(word).width > maxWidth) {
        pushChars(word)
      } else {
        result.push(current.trimEnd())
        current = word.trimStart()
      }
    } else if (ctx.measureText(word).width > maxWidth && !current) {
      pushChars(word)
    } else {
      current = candidate
    }
  }

  if (current) result.push(current.trimEnd())
  return result.length ? result : ['']
}

/**
 * Clip a single line to fit within a maximum width, appending an ellipsis
 * @param ctx Canvas 2D context with font already set
 * @param line Logical line text
 * @param maxWidth Maximum line width in image pixels
 * @returns Clipped line
 */
function clipLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string {
  if (maxWidth <= 0 || ctx.measureText(line).width <= maxWidth) return line
  const ellipsis = '…'
  let result = line
  while (result.length > 0 && ctx.measureText(result + ellipsis).width > maxWidth) {
    result = result.slice(0, -1)
  }
  return result ? result + ellipsis : ellipsis
}

/**
 * Resolve display lines from text applying wrap or clip within a max width
 * @param ctx Canvas 2D context with font already set
 * @param text Text content
 * @param maxWidth Maximum line width in image pixels (0 for unlimited)
 * @param overflow Overflow handling mode
 * @returns Display lines to render
 */
export function layoutTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth = 0, overflow: 'wrap' | 'clip' = 'wrap'): string[] {
  const logicalLines = text.split('\n')
  if (maxWidth <= 0) return logicalLines

  if (overflow === 'clip') {
    return logicalLines.map((line) => clipLine(ctx, line, maxWidth))
  }

  return logicalLines.flatMap((line) => wrapLine(ctx, line, maxWidth))
}

/**
 * Measure the bounding box of centered multi-line text
 * @param ctx Canvas 2D context with font already set
 * @param text Text content
 * @param x Anchor X in image pixels
 * @param y Anchor Y in image pixels
 * @param fontSize Font size in pixels
 * @param maxWidth Maximum line width in image pixels (0 for unlimited)
 * @param overflow Overflow handling mode
 * @returns Text bounds in image pixel space
 */
export function measureTextBounds(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  maxWidth = 0,
  overflow: 'wrap' | 'clip' = 'wrap'
): TextBounds {
  const lines = layoutTextLines(ctx, text, maxWidth, overflow)
  const lineHeight = fontSize * 1.25
  const totalHeight = lines.length * lineHeight
  const startY = y - totalHeight / 2 + lineHeight / 2

  let widest = 0
  for (const line of lines) {
    widest = Math.max(widest, ctx.measureText(line).width)
  }
  const boxWidth = maxWidth > 0 ? Math.max(widest, maxWidth) : widest

  const halfWidth = boxWidth / 2
  const top = startY - lineHeight / 2
  const bottom = startY + (lines.length - 1) * lineHeight + lineHeight / 2

  return {
    left: x - halfWidth,
    top,
    right: x + halfWidth,
    bottom,
    width: boxWidth,
    height: bottom - top,
  }
}

/**
 * Whether a point lies inside text bounds with optional padding
 * @param bounds Text bounds in image pixels
 * @param pointX Point X in image pixels
 * @param pointY Point Y in image pixels
 * @param padding Hit-test padding in image pixels
 * @returns True when the point is inside the padded bounds
 */
export function isPointInTextBounds(bounds: TextBounds, pointX: number, pointY: number, padding = 6): boolean {
  return pointX >= bounds.left - padding && pointX <= bounds.right + padding && pointY >= bounds.top - padding && pointY <= bounds.bottom + padding
}

/**
 * Draw a Photoshop-style dashed selection box around text
 * @param ctx Canvas 2D context
 * @param bounds Text bounds in image pixels
 * @param lineWidth Stroke width in image pixels
 */
export function drawTextSelectionBox(ctx: CanvasRenderingContext2D, bounds: TextBounds, lineWidth = 1.5) {
  const pad = 4
  ctx.save()
  ctx.strokeStyle = '#2d8cff'
  ctx.lineWidth = lineWidth
  ctx.setLineDash([6, 4])
  ctx.strokeRect(bounds.left - pad, bounds.top - pad, bounds.width + pad * 2, bounds.height + pad * 2)
  ctx.restore()
}

/**
 * Draw multi-line text centered at a point with a subtle stroke for readability
 * @param ctx Canvas 2D context
 * @param text Text content
 * @param x Anchor X in image pixels
 * @param y Anchor Y in image pixels
 * @param fontSize Font size in pixels
 * @param color Text fill color
 * @param maxWidth Maximum line width in image pixels (0 for unlimited)
 * @param overflow Overflow handling mode
 */
export function drawTextAtPoint(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  maxWidth = 0,
  overflow: 'wrap' | 'clip' = 'wrap'
) {
  const lines = layoutTextLines(ctx, text, maxWidth, overflow)
  const lineHeight = fontSize * 1.25
  const totalHeight = lines.length * lineHeight
  const startY = y - totalHeight / 2 + lineHeight / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.lineWidth = Math.max(2, fontSize / 14)
  ctx.lineJoin = 'round'

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight
    ctx.strokeText(line, x, lineY)
    ctx.fillText(line, x, lineY)
  })
}

/**
 * Resolve a normalized text box on an image to pixel coordinates
 * @param boxX Normalized left edge
 * @param boxY Normalized top edge
 * @param boxWidth Normalized width
 * @param boxHeight Normalized height
 * @param imageWidth Image width in pixels
 * @param imageHeight Image height in pixels
 * @returns Text box rectangle in image pixels
 */
export function textBoxToPixels(boxX: number, boxY: number, boxWidth: number, boxHeight: number, imageWidth: number, imageHeight: number): TextBoxRect {
  return {
    left: boxX * imageWidth,
    top: boxY * imageHeight,
    width: boxWidth * imageWidth,
    height: boxHeight * imageHeight,
  }
}

/**
 * Draw a dashed frame around a fixed text box
 * @param ctx Canvas 2D context
 * @param rect Text box rectangle in image pixels
 * @param lineWidth Stroke width in image pixels
 */
export function drawTextBoxFrame(ctx: CanvasRenderingContext2D, rect: TextBoxRect, lineWidth = 1.5) {
  ctx.save()
  ctx.strokeStyle = '#2d8cff'
  ctx.lineWidth = lineWidth
  ctx.setLineDash([6, 4])
  ctx.strokeRect(rect.left, rect.top, rect.width, rect.height)
  ctx.restore()
}

/**
 * Whether a point lies inside a text box
 * @param rect Text box rectangle in image pixels
 * @param pointX Point X in image pixels
 * @param pointY Point Y in image pixels
 * @returns True when inside the box
 */
export function isPointInTextBox(rect: TextBoxRect, pointX: number, pointY: number): boolean {
  return pointX >= rect.left && pointX <= rect.left + rect.width && pointY >= rect.top && pointY <= rect.top + rect.height
}

/**
 * Hit-test a text box edge for resize handles
 * @param rect Text box rectangle in image pixels
 * @param pointX Point X in image pixels
 * @param pointY Point Y in image pixels
 * @param threshold Hit threshold in image pixels
 * @returns Matched edge or null
 */
export function hitTestTextBoxEdge(rect: TextBoxRect, pointX: number, pointY: number, threshold: number): TextBoxEdge | null {
  const insideX = pointX >= rect.left && pointX <= rect.left + rect.width
  const insideY = pointY >= rect.top && pointY <= rect.top + rect.height
  const nearTop = insideX && Math.abs(pointY - rect.top) <= threshold
  const nearBottom = insideX && Math.abs(pointY - (rect.top + rect.height)) <= threshold
  const nearLeft = insideY && Math.abs(pointX - rect.left) <= threshold
  const nearRight = insideY && Math.abs(pointX - (rect.left + rect.width)) <= threshold

  if (nearTop) return 'top'
  if (nearBottom) return 'bottom'
  if (nearLeft) return 'left'
  if (nearRight) return 'right'
  return null
}

/**
 * Draw multi-line text inside a fixed box
 * @param ctx Canvas 2D context with font already set
 * @param text Text content
 * @param rect Text box rectangle in image pixels
 * @param fontSize Font size in pixels
 * @param color Text fill color
 * @param overflow Overflow handling mode
 */
export function drawTextInBox(ctx: CanvasRenderingContext2D, text: string, rect: TextBoxRect, fontSize: number, color: string, overflow: 'wrap' | 'clip' = 'wrap') {
  const pad = 4
  const innerWidth = Math.max(0, rect.width - pad * 2)
  const innerHeight = Math.max(0, rect.height - pad * 2)
  if (innerWidth <= 0 || innerHeight <= 0) return

  const lines = layoutTextLines(ctx, text, innerWidth, overflow)
  const lineHeight = fontSize * 1.25
  const maxLines = Math.max(1, Math.floor(innerHeight / lineHeight))
  const visibleLines = lines.slice(0, maxLines)
  const visibleHeight = visibleLines.length * lineHeight
  const startY = rect.top + pad + Math.max(0, (innerHeight - visibleHeight) / 2) + lineHeight / 2
  const centerX = rect.left + rect.width / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.left, rect.top, rect.width, rect.height)
  ctx.clip()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.lineWidth = Math.max(2, fontSize / 14)
  ctx.lineJoin = 'round'

  visibleLines.forEach((line, index) => {
    const lineY = startY + index * lineHeight
    ctx.strokeText(line, centerX, lineY)
    ctx.fillText(line, centerX, lineY)
  })

  ctx.restore()
}

/**
 * Render text onto a single image asset
 * @param asset Source image asset
 * @param config Text overlay settings
 * @returns Output asset input
 */
export async function addTextToImage(asset: StudioAsset, config: AddTextConfig): Promise<StudioAssetInput> {
  const trimmed = config.text.trim()
  if (!trimmed) {
    throw new Error('Text content is required')
  }

  const img = await blobToImage(asset.blob)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  ctx.drawImage(img, 0, 0)
  ctx.font = buildTextFont(config.fontWeight, config.fontSize, config.fontFamily)
  if (hasTextBox(config)) {
    const rect = textBoxToPixels(config.boxX, config.boxY, config.boxWidth, config.boxHeight, canvas.width, canvas.height)
    drawTextInBox(ctx, trimmed, rect, config.fontSize, config.color, config.overflow)
  }

  const blob = await canvasToBlob(canvas, config.format, config.quality)
  const ext = config.format.split('/')[1]
  const baseName = asset.name.replace(/\.[^.]+$/, '')

  return {
    name: `${baseName}-text.${ext}`,
    kind: 'image',
    source: 'text',
    mimeType: config.format,
    blob,
    width: canvas.width,
    height: canvas.height,
    size: blob.size,
    parentId: asset.id,
    meta: {
      text: trimmed,
      boxX: config.boxX,
      boxY: config.boxY,
      boxWidth: config.boxWidth,
      boxHeight: config.boxHeight,
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      color: config.color,
    },
  }
}
