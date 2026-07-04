'use client'

/**
 * Interactive add-text preview with Photoshop-style box drawing, resize, and inline editing
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { FiMinus, FiPlus, FiX } from 'react-icons/fi'

import { blobToImage } from '@/lib/image/canvas'
import {
  buildTextFont,
  drawTextBoxFrame,
  drawTextInBox,
  hasTextBox,
  hitTestTextBoxEdge,
  isPointInTextBox,
  type TextBoxEdge,
  type TextBoxRect,
  textBoxToPixels,
} from '@/lib/studio/operations/add-text'
import type { StudioAsset } from '@/lib/studio/types'

import { useStudio } from '../../context/StudioContext'

interface AddTextPreviewViewProps {
  /** Source image asset */
  asset: StudioAsset
}

/** Layout transform mapping image space to the preview canvas */
interface FitTransform {
  drawX: number
  drawY: number
  scale: number
  imageWidth: number
  imageHeight: number
}

/** Screen layout for the inline editor */
interface EditorScreenLayout {
  left: number
  top: number
  width: number
  height: number
  fontSize: number
}

/** Normalized text box */
interface NormalizedBox {
  boxX: number
  boxY: number
  boxWidth: number
  boxHeight: number
}

const CLICK_DRAG_THRESHOLD = 5
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const EDGE_HIT_SCREEN_PX = 8
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 160

/**
 * Clamp font size to supported preview range
 * @param fontSize Requested font size in pixels
 * @returns Clamped font size
 */
function clampFontSize(fontSize: number): number {
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(fontSize)))
}

/**
 * Compute the base fit scale for an image inside a container
 */
function computeBaseFitScale(containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number): number {
  const imageAspect = imageWidth / imageHeight
  const containerAspect = containerWidth / containerHeight
  let fitWidth = containerWidth
  if (imageAspect <= containerAspect) {
    fitWidth = containerHeight * imageAspect
  }
  return fitWidth / imageWidth
}

/**
 * Compute a centered fit transform with zoom and pan
 */
function computeFitTransform(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  offsetX: number,
  offsetY: number
): FitTransform {
  const baseFitScale = computeBaseFitScale(containerWidth, containerHeight, imageWidth, imageHeight)
  const scale = baseFitScale * zoom
  const scaledWidth = imageWidth * scale
  const scaledHeight = imageHeight * scale
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  return {
    drawX: centerX - scaledWidth / 2 + offsetX,
    drawY: centerY - scaledHeight / 2 + offsetY,
    scale,
    imageWidth,
    imageHeight,
  }
}

/**
 * Convert screen coordinates to image pixel coordinates
 */
function screenToImagePixels(screenX: number, screenY: number, transform: FitTransform): { x: number; y: number } {
  return {
    x: (screenX - transform.drawX) / transform.scale,
    y: (screenY - transform.drawY) / transform.scale,
  }
}

/**
 * Whether a screen point lies within the drawn image bounds
 */
function isPointOnImage(screenX: number, screenY: number, transform: FitTransform): boolean {
  const { x, y } = screenToImagePixels(screenX, screenY, transform)
  return x >= 0 && x <= transform.imageWidth && y >= 0 && y <= transform.imageHeight
}

/**
 * Minimum box size in image pixels based on font size
 */
function minBoxPixels(fontSize: number): { width: number; height: number } {
  return { width: fontSize, height: fontSize * 1.25 }
}

/**
 * Build a normalized box from two image-space corner points
 */
function boxFromCorners(x1: number, y1: number, x2: number, y2: number, fontSize: number, imageWidth: number, imageHeight: number): NormalizedBox {
  const min = minBoxPixels(fontSize)
  let left = Math.min(x1, x2)
  let top = Math.min(y1, y2)
  let width = Math.max(Math.abs(x2 - x1), min.width)
  let height = Math.max(Math.abs(y2 - y1), min.height)

  left = Math.max(0, Math.min(left, imageWidth - width))
  top = Math.max(0, Math.min(top, imageHeight - height))

  return {
    boxX: left / imageWidth,
    boxY: top / imageHeight,
    boxWidth: width / imageWidth,
    boxHeight: height / imageHeight,
  }
}

/**
 * Resize a normalized box from one edge
 */
function resizeBoxFromEdge(box: NormalizedBox, edge: TextBoxEdge, pointerX: number, pointerY: number, fontSize: number, imageWidth: number, imageHeight: number): NormalizedBox {
  const rect = textBoxToPixels(box.boxX, box.boxY, box.boxWidth, box.boxHeight, imageWidth, imageHeight)
  const min = minBoxPixels(fontSize)
  let { left, top, width, height } = rect

  if (edge === 'left') {
    const right = left + width
    left = Math.min(pointerX, right - min.width)
    width = right - left
  } else if (edge === 'right') {
    width = Math.max(pointerX - left, min.width)
  } else if (edge === 'top') {
    const bottom = top + height
    top = Math.min(pointerY, bottom - min.height)
    height = bottom - top
  } else if (edge === 'bottom') {
    height = Math.max(pointerY - top, min.height)
  }

  left = Math.max(0, Math.min(left, imageWidth - width))
  top = Math.max(0, Math.min(top, imageHeight - height))
  width = Math.min(width, imageWidth - left)
  height = Math.min(height, imageHeight - top)

  return {
    boxX: left / imageWidth,
    boxY: top / imageHeight,
    boxWidth: width / imageWidth,
    boxHeight: height / imageHeight,
  }
}

/**
 * Add-text preview with box drawing, edge resize, move, and inline editing
 */
export function AddTextPreviewView(props: AddTextPreviewViewProps) {
  const { asset } = props
  const { addTextSettings, setAddTextSettings } = useStudio()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<FitTransform | null>(null)
  const boxRectRef = useRef<TextBoxRect | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const isDrawingBoxRef = useRef(false)
  const isResizingRef = useRef(false)
  const isDraggingBoxRef = useRef(false)
  const isPanningRef = useRef(false)
  const resizeEdgeRef = useRef<TextBoxEdge | null>(null)
  const drawStartRef = useRef({ x: 0, y: 0 })
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const panStartRef = useRef({ clientX: 0, clientY: 0, offsetX: 0, offsetY: 0 })
  const pointerDownRef = useRef<{ clientX: number; clientY: number; target: 'box' | 'edge' | 'outside' | 'draw'; edge?: TextBoxEdge } | null>(null)
  const previewBoxRef = useRef<NormalizedBox | null>(null)

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editorLayout, setEditorLayout] = useState<EditorScreenLayout | null>(null)
  const [closeButtonPosition, setCloseButtonPosition] = useState<{ left: number; top: number } | null>(null)
  const [interactionCursor, setInteractionCursor] = useState('cursor-crosshair')

  const boxPlaced = hasTextBox(addTextSettings)

  useEffect(() => {
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
    setIsEditing(false)
  }, [asset.id])

  useEffect(() => {
    if (!isEditing) return
    editorRef.current?.focus()
  }, [isEditing, editorLayout?.left, editorLayout?.top])

  useEffect(() => {
    let active = true
    blobToImage(asset.blob)
      .then((img) => {
        if (active) setImage(img)
      })
      .catch(() => {
        if (active) setImage(null)
      })
    return () => {
      active = false
    }
  }, [asset.blob, asset.id])

  const getActiveBox = useCallback((): NormalizedBox | null => {
    if (previewBoxRef.current) return previewBoxRef.current
    if (!boxPlaced) return null
    return {
      boxX: addTextSettings.boxX,
      boxY: addTextSettings.boxY,
      boxWidth: addTextSettings.boxWidth,
      boxHeight: addTextSettings.boxHeight,
    }
  }, [addTextSettings.boxHeight, addTextSettings.boxWidth, addTextSettings.boxX, addTextSettings.boxY, boxPlaced])

  const applyBox = useCallback(
    (box: NormalizedBox) => {
      setAddTextSettings((prev) => ({ ...prev, ...box }))
    },
    [setAddTextSettings]
  )

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    canvas.width = containerWidth
    canvas.height = containerHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const imageWidth = image.naturalWidth || image.width
    const imageHeight = image.naturalHeight || image.height
    const transform = computeFitTransform(containerWidth, containerHeight, imageWidth, imageHeight, zoom, offsetX, offsetY)
    transformRef.current = transform

    ctx.save()
    ctx.translate(transform.drawX, transform.drawY)
    ctx.scale(transform.scale, transform.scale)
    ctx.drawImage(image, 0, 0)

    const activeBox = getActiveBox()
    if (activeBox) {
      const rect = textBoxToPixels(activeBox.boxX, activeBox.boxY, activeBox.boxWidth, activeBox.boxHeight, imageWidth, imageHeight)
      boxRectRef.current = rect
      drawTextBoxFrame(ctx, rect, 1.5 / transform.scale)

      const trimmed = addTextSettings.text.trim()
      if (trimmed && !isEditing) {
        ctx.font = buildTextFont(addTextSettings.fontWeight, addTextSettings.fontSize, addTextSettings.fontFamily)
        drawTextInBox(ctx, trimmed, rect, addTextSettings.fontSize, addTextSettings.color, addTextSettings.overflow)
      }

      setEditorLayout({
        left: transform.drawX + rect.left * transform.scale,
        top: transform.drawY + rect.top * transform.scale,
        width: rect.width * transform.scale,
        height: rect.height * transform.scale,
        fontSize: addTextSettings.fontSize * transform.scale,
      })
      setCloseButtonPosition({
        left: transform.drawX + (rect.left + rect.width) * transform.scale,
        top: transform.drawY + rect.top * transform.scale,
      })
    } else {
      boxRectRef.current = null
      setEditorLayout(null)
      setCloseButtonPosition(null)
    }

    ctx.restore()
  }, [addTextSettings, getActiveBox, image, isEditing, offsetX, offsetY, zoom])

  useEffect(() => {
    drawPreview()
  }, [drawPreview])

  useEffect(() => {
    const handleResize = () => drawPreview()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawPreview])

  const clientToImage = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const transform = transformRef.current
    if (!canvas || !transform) return null
    const rect = canvas.getBoundingClientRect()
    return screenToImagePixels(clientX - rect.left, clientY - rect.top, transform)
  }, [])

  const hitTestAtClient = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      const transform = transformRef.current
      const boxRect = boxRectRef.current
      if (!canvas || !transform) return { target: 'outside' as const }

      const rect = canvas.getBoundingClientRect()
      const screenX = clientX - rect.left
      const screenY = clientY - rect.top
      if (!isPointOnImage(screenX, screenY, transform)) return { target: 'outside' as const }

      if (!boxPlaced && !previewBoxRef.current) return { target: 'draw' as const }

      if (!boxRect) return { target: 'outside' as const }

      const { x, y } = screenToImagePixels(screenX, screenY, transform)
      const edgeThreshold = EDGE_HIT_SCREEN_PX / transform.scale
      const edge = hitTestTextBoxEdge(boxRect, x, y, edgeThreshold)
      if (edge) return { target: 'edge' as const, edge }

      if (isPointInTextBox(boxRect, x, y)) return { target: 'box' as const }
      return { target: 'outside' as const }
    },
    [boxPlaced]
  )

  const endInteractions = useCallback(() => {
    isDrawingBoxRef.current = false
    isResizingRef.current = false
    isDraggingBoxRef.current = false
    isPanningRef.current = false
    resizeEdgeRef.current = null
    previewBoxRef.current = null
    pointerDownRef.current = null
  }, [])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const pointerDown = pointerDownRef.current
      const transform = transformRef.current
      const imagePoint = clientToImage(event.clientX, event.clientY)

      if (pointerDown && !isDrawingBoxRef.current && !isResizingRef.current && !isDraggingBoxRef.current && !isPanningRef.current) {
        const distance = Math.hypot(event.clientX - pointerDown.clientX, event.clientY - pointerDown.clientY)
        if (distance > CLICK_DRAG_THRESHOLD) {
          if (pointerDown.target === 'draw') {
            isDrawingBoxRef.current = true
          } else if (pointerDown.target === 'edge' && pointerDown.edge) {
            isResizingRef.current = true
            resizeEdgeRef.current = pointerDown.edge
          } else if (pointerDown.target === 'box') {
            isDraggingBoxRef.current = true
            setIsEditing(false)
          } else {
            isPanningRef.current = true
            panStartRef.current = { clientX: pointerDown.clientX, clientY: pointerDown.clientY, offsetX, offsetY }
          }
        }
      }

      if (isDrawingBoxRef.current && imagePoint && transform) {
        previewBoxRef.current = boxFromCorners(
          drawStartRef.current.x,
          drawStartRef.current.y,
          imagePoint.x,
          imagePoint.y,
          addTextSettings.fontSize,
          transform.imageWidth,
          transform.imageHeight
        )
        drawPreview()
        return
      }

      if (isResizingRef.current && imagePoint && transform && resizeEdgeRef.current) {
        const current = getActiveBox()
        if (!current) return
        previewBoxRef.current = resizeBoxFromEdge(current, resizeEdgeRef.current, imagePoint.x, imagePoint.y, addTextSettings.fontSize, transform.imageWidth, transform.imageHeight)
        drawPreview()
        return
      }

      if (isDraggingBoxRef.current && imagePoint && transform) {
        const current = getActiveBox()
        if (!current) return
        const rect = textBoxToPixels(current.boxX, current.boxY, current.boxWidth, current.boxHeight, transform.imageWidth, transform.imageHeight)
        const width = rect.width
        const height = rect.height
        let left = imagePoint.x - dragOffsetRef.current.x
        let top = imagePoint.y - dragOffsetRef.current.y
        left = Math.max(0, Math.min(left, transform.imageWidth - width))
        top = Math.max(0, Math.min(top, transform.imageHeight - height))
        previewBoxRef.current = {
          boxX: left / transform.imageWidth,
          boxY: top / transform.imageHeight,
          boxWidth: current.boxWidth,
          boxHeight: current.boxHeight,
        }
        drawPreview()
        return
      }

      if (isPanningRef.current) {
        const start = panStartRef.current
        setOffsetX(start.offsetX + (event.clientX - start.clientX))
        setOffsetY(start.offsetY + (event.clientY - start.clientY))
        return
      }

      const hit = hitTestAtClient(event.clientX, event.clientY)
      if (hit.target === 'edge' && hit.edge === 'top') setInteractionCursor('cursor-ns-resize')
      else if (hit.target === 'edge' && hit.edge === 'bottom') setInteractionCursor('cursor-ns-resize')
      else if (hit.target === 'edge' && hit.edge === 'left') setInteractionCursor('cursor-ew-resize')
      else if (hit.target === 'edge' && hit.edge === 'right') setInteractionCursor('cursor-ew-resize')
      else if (hit.target === 'box') setInteractionCursor(isEditing ? 'cursor-text' : 'cursor-move')
      else if (!boxPlaced) setInteractionCursor('cursor-crosshair')
      else setInteractionCursor('cursor-grab')
    }

    const handleMouseUp = () => {
      const pointerDown = pointerDownRef.current

      if (isDrawingBoxRef.current && previewBoxRef.current) {
        applyBox(previewBoxRef.current)
        setIsEditing(true)
      } else if (isResizingRef.current && previewBoxRef.current) {
        applyBox(previewBoxRef.current)
      } else if (isDraggingBoxRef.current && previewBoxRef.current) {
        applyBox(previewBoxRef.current)
      } else if (pointerDown && !isPanningRef.current) {
        if (pointerDown.target === 'box') {
          setIsEditing(true)
        } else if (pointerDown.target === 'outside' && isEditing) {
          setIsEditing(false)
        }
      }

      endInteractions()
      drawPreview()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [addTextSettings.fontSize, applyBox, boxPlaced, clientToImage, drawPreview, endInteractions, getActiveBox, hitTestAtClient, isEditing, offsetX, offsetY])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return
      event.preventDefault()

      const hit = hitTestAtClient(event.clientX, event.clientY)
      const imagePoint = clientToImage(event.clientX, event.clientY)

      if (hit.target === 'draw' && imagePoint) {
        drawStartRef.current = { x: imagePoint.x, y: imagePoint.y }
        pointerDownRef.current = { clientX: event.clientX, clientY: event.clientY, target: 'draw' }
        return
      }

      if (hit.target === 'edge') {
        pointerDownRef.current = { clientX: event.clientX, clientY: event.clientY, target: 'edge', edge: hit.edge }
        return
      }

      if (hit.target === 'box' && imagePoint && boxRectRef.current) {
        dragOffsetRef.current = { x: imagePoint.x - boxRectRef.current.left, y: imagePoint.y - boxRectRef.current.top }
        pointerDownRef.current = { clientX: event.clientX, clientY: event.clientY, target: 'box' }
        return
      }

      pointerDownRef.current = { clientX: event.clientX, clientY: event.clientY, target: 'outside' }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    return () => canvas.removeEventListener('mousedown', handleMouseDown)
  }, [clientToImage, hitTestAtClient])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !image) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const imageWidth = image.naturalWidth || image.width
      const imageHeight = image.naturalHeight || image.height
      const baseFitScale = computeBaseFitScale(containerWidth, containerHeight, imageWidth, imageHeight)
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      const centerX = containerWidth / 2
      const centerY = containerHeight / 2

      setZoom((prevZoom) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom * zoomFactor))
        const worldX = (mouseX - centerX - offsetX) / (baseFitScale * prevZoom)
        const worldY = (mouseY - centerY - offsetY) / (baseFitScale * prevZoom)
        setOffsetX(mouseX - centerX - worldX * baseFitScale * newZoom)
        setOffsetY(mouseY - centerY - worldY * baseFitScale * newZoom)
        return newZoom
      })
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [image, offsetX, offsetY])

  const handleRemoveText = useCallback(() => {
    setAddTextSettings((prev) => ({
      ...prev,
      text: '',
      boxX: 0,
      boxY: 0,
      boxWidth: 0,
      boxHeight: 0,
    }))
    setIsEditing(false)
  }, [setAddTextSettings])

  const changeFontSize = useCallback(
    (nextSize: number) => {
      setAddTextSettings((prev) => ({ ...prev, fontSize: clampFontSize(nextSize) }))
    },
    [setAddTextSettings]
  )

  const cursorClass = interactionCursor

  return (
    <div ref={containerRef} className="relative h-full studio-checkerboard">
      <canvas ref={canvasRef} className={`block h-full w-full ${cursorClass}`} />

      {isEditing && editorLayout ? (
        <textarea
          ref={editorRef}
          value={addTextSettings.text}
          onChange={(event) => setAddTextSettings((prev) => ({ ...prev, text: event.target.value }))}
          onMouseDown={(event) => event.stopPropagation()}
          onScroll={(event) => {
            event.currentTarget.scrollTop = 0
            event.currentTarget.scrollLeft = 0
          }}
          onWheel={(event) => event.stopPropagation()}
          placeholder="Type here"
          spellCheck={false}
          className={`absolute z-10 resize-none border-0 bg-transparent p-1 text-center leading-[1.25] outline-none placeholder:opacity-50 ${
            addTextSettings.overflow === 'clip' ? 'overflow-hidden' : 'overflow-hidden'
          }`}
          style={{
            left: editorLayout.left,
            top: editorLayout.top,
            width: editorLayout.width,
            height: editorLayout.height,
            fontSize: editorLayout.fontSize,
            fontFamily: addTextSettings.fontFamily,
            fontWeight: addTextSettings.fontWeight,
            color: addTextSettings.color,
            caretColor: addTextSettings.color,
            lineHeight: 1.25,
            whiteSpace: addTextSettings.overflow === 'clip' ? 'nowrap' : 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      ) : null}

      {boxPlaced ? (
        <div
          className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)]/95 px-1.5 py-1 shadow-studio-sm backdrop-blur-sm"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Decrease font size"
            onClick={() => changeFontSize(addTextSettings.fontSize - 2)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--studio-surface-fg-muted)] transition-colors hover:bg-[var(--studio-surface-muted)] hover:text-[var(--studio-surface-fg)]"
          >
            <FiMinus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <label className="flex items-center gap-1 px-1 text-xs text-[var(--studio-surface-fg-muted)]">
            <span className="sr-only">Font size</span>
            <input
              type="number"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={addTextSettings.fontSize}
              onChange={(event) => changeFontSize(Number(event.target.value))}
              className="w-12 rounded-studio-sm border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] px-1 py-0.5 text-center text-xs text-[var(--studio-surface-fg)] outline-none focus:ring-1 focus:ring-[var(--studio-accent)]"
            />
            <span>px</span>
          </label>
          <button
            type="button"
            aria-label="Increase font size"
            onClick={() => changeFontSize(addTextSettings.fontSize + 2)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--studio-surface-fg-muted)] transition-colors hover:bg-[var(--studio-surface-muted)] hover:text-[var(--studio-surface-fg)]"
          >
            <FiPlus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      {boxPlaced && closeButtonPosition ? (
        <button
          type="button"
          aria-label="Remove text"
          onClick={handleRemoveText}
          onMouseDown={(event) => event.stopPropagation()}
          className="absolute z-10 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--studio-surface-bg)] text-[var(--studio-surface-fg-muted)] shadow-studio-sm ring-1 ring-[var(--studio-surface-border)] transition-colors hover:bg-red-50 hover:text-red-600"
          style={{ left: closeButtonPosition.left, top: closeButtonPosition.top }}
        >
          <FiX className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
