import { canvasToBlob, createCanvasFromImage, createCanvasFromImageData, createImageDataFromImage, downloadImage, fileToImage } from './image-utils'
import { type BackgroundRemovalUserConfig, getOutputExtension } from './model-config'
import { processImage } from './segmentation-worker'
import type { ImageItem, ImageItemStatus } from './types'

/**
 * Create an ImageItem from a File
 * @param file Image file to load
 * @returns Promise resolving to a new ImageItem with pending status
 */
export async function createImageItemFromFile(file: File): Promise<ImageItem> {
  const image = await fileToImage(file)

  return {
    id: crypto.randomUUID(),
    file,
    image,
    processedImageData: null,
    status: 'pending',
  }
}

/**
 * Create ImageItems from multiple files, filtering non-image files
 * @param files File list from input or drag-and-drop
 * @returns Promise resolving to valid image items
 */
export async function createImageItemsFromFiles(files: FileList | File[]): Promise<ImageItem[]> {
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
  return Promise.all(imageFiles.map((file) => createImageItemFromFile(file)))
}

/**
 * Process a single image item with AI segmentation
 * @param item Image item to process
 * @param config User processing configuration
 * @returns Updated image item with processed data or error status
 */
export async function processImageItem(item: ImageItem, config: BackgroundRemovalUserConfig): Promise<ImageItem> {
  try {
    const imageData = createImageDataFromImage(item.image)
    const segmentedData = await processImage(imageData, config)

    if (!segmentedData) {
      return {
        ...item,
        status: 'error',
        errorMessage: 'Segmentation returned no result',
      }
    }

    return {
      ...item,
      processedImageData: segmentedData,
      status: 'done',
    }
  } catch (error) {
    return {
      ...item,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Processing failed',
    }
  }
}

/**
 * Update a single item in an image list by id
 * @param items Current image list
 * @param id Item id to update
 * @param updates Partial fields to merge
 * @returns Updated image list
 */
export function updateImageItem(items: ImageItem[], id: string, updates: Partial<ImageItem>): ImageItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item))
}

/**
 * Derive output filename for a processed image
 * @param file Original file
 * @param config Processing configuration for extension
 * @returns Processed filename
 */
export function getProcessedFilename(file: File, config: BackgroundRemovalUserConfig): string {
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const ext = getOutputExtension(config.outputFormat)
  return `${baseName}-processed.${ext}`
}

/**
 * Download a single image item (processed or original)
 * @param item Image item to download
 * @param config Processing configuration for filename
 */
export async function downloadImageItem(item: ImageItem, config: BackgroundRemovalUserConfig): Promise<void> {
  if (item.processedImageData) {
    const canvas = createCanvasFromImageData(item.processedImageData)
    const mimeType = config.outputFormat === 'image/png' || config.outputFormat === 'image/jpeg' || config.outputFormat === 'image/webp' ? config.outputFormat : 'image/webp'
    const quality = mimeType === 'image/png' ? undefined : config.outputQuality
    const blob = await canvasToBlob(canvas, mimeType, quality)
    downloadImage(blob, getProcessedFilename(item.file, config))
    return
  }

  const canvas = createCanvasFromImage(item.image)
  const blob = await canvasToBlob(canvas)
  downloadImage(blob, item.file.name)
}

/**
 * Download all image items sequentially with a short delay between each
 * @param items Image items to download
 * @param config Processing configuration for filenames
 * @param delayMs Delay between downloads in milliseconds
 */
export async function downloadAllImageItems(items: ImageItem[], config: BackgroundRemovalUserConfig, delayMs = 300): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    await downloadImageItem(items[i], config)
    if (i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * Count items by status
 * @param items Image list
 * @param status Status to count
 * @returns Number of matching items
 */
export function countByStatus(items: ImageItem[], status: ImageItemStatus): number {
  return items.filter((item) => item.status === status).length
}
