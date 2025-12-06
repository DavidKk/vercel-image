/**
 * Segmentation worker wrapper
 * Provides a clean API for using the Web Worker
 */

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
  payload?: any
}

interface WorkerResponse {
  type: 'PROGRESS' | 'RESULT' | 'ERROR' | 'SUPPORT'
  payload?: any
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

/** Check if auto segmentation is supported */
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

/** Initialize model in worker */
export async function initializeModel(onProgress?: (progress: SegmentationProgress) => void): Promise<boolean> {
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
    w.postMessage({ type: 'INIT_MODEL' } as WorkerMessage)
  })
}

/** Process image in worker */
export async function autoSegmentPerson(imageData: ImageData, onProgress?: (progress: SegmentationProgress) => void): Promise<ImageData | null> {
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
    w.postMessage({ type: 'PROCESS_IMAGE', payload: { imageData } } as WorkerMessage)
  })
}

/** Cleanup worker */
export function cleanupWorker(): void {
  if (worker) {
    worker.terminate()
    worker = null
  }
}
