/**
 * Shared canvas / image conversion utilities
 */

/**
 * Convert a canvas to a Blob
 * @param canvas Source canvas element
 * @param mimeType Output MIME type
 * @param quality Output quality for lossy formats (0-1)
 * @returns Promise resolving to the encoded blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, mimeType = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      mimeType,
      quality
    )
  })
}

/**
 * Trigger a browser download for a blob
 * @param blob Data to download
 * @param filename Suggested file name
 * @returns Nothing
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Load an image file into an HTMLImageElement
 * @param file Source image file
 * @returns Promise resolving to the loaded image
 */
export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to decode image blob'))
    }
    img.src = url
  })
}

/**
 * Load a blob into an HTMLImageElement
 * @param blob Source blob
 * @returns Promise resolving to the loaded image
 */
export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to decode image blob'))
    }
    img.src = url
  })
}

/**
 * Create a canvas rendered from an image element
 * @param image Source image
 * @returns Canvas containing the image
 */
export function createCanvasFromImage(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }
  ctx.drawImage(image, 0, 0)
  return canvas
}

/**
 * Create a canvas rendered from raw pixel data
 * @param imageData Source pixel data
 * @returns Canvas containing the pixels
 */
export function createCanvasFromImageData(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Extract raw pixel data from an image element
 * @param image Source image
 * @returns Pixel data of the image
 */
export function createImageDataFromImage(image: HTMLImageElement): ImageData {
  const canvas = createCanvasFromImage(image)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}
