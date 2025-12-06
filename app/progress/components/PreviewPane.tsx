'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface PreviewPaneProps {
  imageData?: ImageData | null
  image?: HTMLImageElement | null
  className?: string
}

export function PreviewPane(props: PreviewPaneProps) {
  const { imageData, image, className } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Zoom and pan state
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

  // Interaction state
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouseX, setLastMouseX] = useState(0)
  const [lastMouseY, setLastMouseY] = useState(0)
  const [touchDistance, setTouchDistance] = useState(0)
  const [lastScale, setLastScale] = useState(1)

  // Calculate base image dimensions and fit scale
  const getBaseImageInfo = useCallback(() => {
    if (imageData) {
      return {
        width: imageData.width,
        height: imageData.height,
      }
    } else if (image) {
      return {
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      }
    }
    return null
  }, [imageData, image])

  // Draw image with zoom and pan
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageInfo = getBaseImageInfo()
    if (!imageInfo) return

    // Get container dimensions (accounting for padding)
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // Set canvas to fill container (padding is handled by container's padding)
    canvas.width = containerWidth
    canvas.height = containerHeight

    // Fill with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate base fit scale (to fit image in container)
    const imageAspect = imageInfo.width / imageInfo.height
    const canvasAspect = containerWidth / containerHeight
    let baseFitWidth = containerWidth

    if (imageAspect > canvasAspect) {
      // Image is wider, fit by width
      baseFitWidth = containerWidth
    } else {
      // Image is taller, fit by height
      baseFitWidth = containerHeight * imageAspect
    }

    const baseFitScale = baseFitWidth / imageInfo.width

    // Apply zoom and pan
    const scaledWidth = imageInfo.width * baseFitScale * scale
    const scaledHeight = imageInfo.height * baseFitScale * scale

    // Center position
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    // Draw position with pan offset
    const drawX = centerX - scaledWidth / 2 + offsetX
    const drawY = centerY - scaledHeight / 2 + offsetY

    ctx.save()
    ctx.translate(drawX, drawY)
    ctx.scale(baseFitScale * scale, baseFitScale * scale)

    if (imageData) {
      // Create temporary canvas to draw image data
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = imageData.width
      tempCanvas.height = imageData.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.putImageData(imageData, 0, 0)
        ctx.drawImage(tempCanvas, 0, 0)
      }
    } else if (image) {
      ctx.drawImage(image, 0, 0)
    }

    ctx.restore()
  }, [imageData, image, scale, offsetX, offsetY, getBaseImageInfo])

  // Reset zoom and pan when image changes
  useEffect(() => {
    setScale(1)
    setOffsetX(0)
    setOffsetY(0)
  }, [imageData, image])

  // Draw on changes
  useEffect(() => {
    drawImage()
  }, [drawImage])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawImage()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [drawImage])

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const container = containerRef.current
      if (!container) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Zoom factor (support trackpad pinch)
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const minScale = 0.1
      const maxScale = 5

      setScale((prevScale) => {
        const newScale = Math.max(minScale, Math.min(maxScale, prevScale * zoomFactor))

        // Zoom towards mouse position
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight
        const imageInfo = getBaseImageInfo()
        if (imageInfo) {
          const imageAspect = imageInfo.width / imageInfo.height
          const canvasAspect = containerWidth / containerHeight
          let baseFitWidth = containerWidth
          if (imageAspect > canvasAspect) {
            // Image is wider, fit by width
            baseFitWidth = containerWidth
          } else {
            // Image is taller, fit by height
            baseFitWidth = containerHeight * imageAspect
          }
          const baseFitScale = baseFitWidth / imageInfo.width

          const centerX = containerWidth / 2
          const centerY = containerHeight / 2
          const worldX = (mouseX - centerX - offsetX) / (baseFitScale * prevScale)
          const worldY = (mouseY - centerY - offsetY) / (baseFitScale * prevScale)

          const newOffsetX = mouseX - centerX - worldX * baseFitScale * newScale
          const newOffsetY = mouseY - centerY - worldY * baseFitScale * newScale

          setOffsetX(newOffsetX)
          setOffsetY(newOffsetY)
        }

        return newScale
      })
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [offsetX, offsetY, getBaseImageInfo])

  // Mouse drag pan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left mouse button
        setIsDragging(true)
        setLastMouseX(e.clientX)
        setLastMouseY(e.clientY)
        canvas.style.cursor = 'grabbing'
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - lastMouseX
        const deltaY = e.clientY - lastMouseY
        setOffsetX((prev) => prev + deltaX)
        setOffsetY((prev) => prev + deltaY)
        setLastMouseX(e.clientX)
        setLastMouseY(e.clientY)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (canvas) {
        canvas.style.cursor = scale > 1 ? 'grab' : 'default'
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, lastMouseX, lastMouseY, scale])

  // Touch events for trackpad pinch zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
        setTouchDistance(distance)
        setLastScale(scale)
      } else if (e.touches.length === 1) {
        setIsDragging(true)
        setLastMouseX(e.touches[0].clientX)
        setLastMouseY(e.touches[0].clientY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)

        if (touchDistance > 0) {
          const scaleFactor = distance / touchDistance
          const minScale = 0.1
          const maxScale = 5
          const newScale = Math.max(minScale, Math.min(maxScale, lastScale * scaleFactor))
          setScale(newScale)
        }
      } else if (e.touches.length === 1 && isDragging) {
        e.preventDefault()
        const touch = e.touches[0]
        const deltaX = touch.clientX - lastMouseX
        const deltaY = touch.clientY - lastMouseY
        setOffsetX((prev) => prev + deltaX)
        setOffsetY((prev) => prev + deltaY)
        setLastMouseX(touch.clientX)
        setLastMouseY(touch.clientY)
      }
    }

    const handleTouchEnd = () => {
      setTouchDistance(0)
      setIsDragging(false)
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [touchDistance, lastScale, scale, isDragging, lastMouseX, lastMouseY])

  // Update cursor style based on scale
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (scale > 1) {
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab'
    } else {
      canvas.style.cursor = 'default'
    }
  }, [scale, isDragging])

  return (
    <div ref={containerRef} className={`w-full h-full p-4 ${className || ''}`}>
      <canvas ref={canvasRef} className="w-full h-full shadow-lg" style={{ display: 'block' }} />
    </div>
  )
}
