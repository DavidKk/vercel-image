/**
 * Segmentation worker wrapper
 * Provides a clean API for using the Web Worker
 */

import type { BackgroundRemovalUserConfig } from './model-config'

export interface SegmentationProgress {
  progress: number // 0-100
  status: string
  downloadedBytes?: number // Downloaded bytes
  totalBytes?: number // Total bytes
  isInitializing?: boolean // Whether model is initializing after download
}

/** Worker message types */
interface WorkerMessage {
  type: 'INIT_MODEL' | 'PROCESS_IMAGE' | 'CHECK_SUPPORT'
  payload?: {
    config?: BackgroundRemovalUserConfig
    imageData?: ImageData
  }
}

interface WorkerResponse {
  type: 'PROGRESS' | 'RESULT' | 'ERROR' | 'SUPPORT'
  payload?: {
    supported?: boolean
    success?: boolean
    imageData?: ImageData | null
    error?: string
    modelCacheKey?: string
  }
}

let worker: Worker | null = null

/** Initialize the worker */
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/segmentation.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return worker
}

/**
 * Check if auto segmentation is supported
 * @returns Whether the library can be loaded
 */
export async function checkAutoSegmentSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const w = getWorker()

    const handler = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'SUPPORT') {
        w.removeEventListener('message', handler)
        resolve(event.data.payload?.supported ?? false)
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ type: 'CHECK_SUPPORT' } as WorkerMessage)
  })
}

/**
 * Initialize model in worker
 * @param config User processing configuration
 * @param onProgress Optional progress callback
 * @returns Whether initialization succeeded
 */
export async function initializeModel(config: BackgroundRemovalUserConfig, onProgress?: (progress: SegmentationProgress) => void): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const w = getWorker()

    const handler = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'PROGRESS' && onProgress) {
        onProgress(event.data.payload as SegmentationProgress)
      } else if (event.data.type === 'RESULT') {
        w.removeEventListener('message', handler)
        resolve(event.data.payload?.success ?? false)
      } else if (event.data.type === 'ERROR') {
        w.removeEventListener('message', handler)
        reject(new Error(event.data.payload?.error ?? 'Unknown error'))
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ type: 'INIT_MODEL', payload: { config } } as WorkerMessage)
  })
}

/**
 * Process image in worker
 * @param imageData Source image data
 * @param config User processing configuration
 * @param onProgress Optional progress callback
 * @returns Processed image data or null
 */
export async function processImage(imageData: ImageData, config: BackgroundRemovalUserConfig, onProgress?: (progress: SegmentationProgress) => void): Promise<ImageData | null> {
  return new Promise((resolve, reject) => {
    const w = getWorker()

    const handler = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'PROGRESS' && onProgress) {
        onProgress(event.data.payload as SegmentationProgress)
      } else if (event.data.type === 'RESULT') {
        w.removeEventListener('message', handler)
        resolve(event.data.payload?.imageData ?? null)
      } else if (event.data.type === 'ERROR') {
        w.removeEventListener('message', handler)
        reject(new Error(event.data.payload?.error ?? 'Unknown error'))
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ type: 'PROCESS_IMAGE', payload: { imageData, config } } as WorkerMessage)
  })
}

/** Cleanup worker */
export function cleanupWorker(): void {
  if (worker) {
    worker.terminate()
    worker = null
  }
}
