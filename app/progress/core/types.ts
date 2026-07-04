/**
 * Processing status for a single image item
 */
export type ImageItemStatus = 'pending' | 'processing' | 'done' | 'error'

/**
 * A single image in the batch queue
 */
export interface ImageItem {
  /** Unique identifier */
  id: string
  /** Original file */
  file: File
  /** Loaded HTML image element */
  image: HTMLImageElement
  /** Processed image data after AI segmentation */
  processedImageData: ImageData | null
  /** Current processing status */
  status: ImageItemStatus
  /** Error message when status is error */
  errorMessage?: string
}
