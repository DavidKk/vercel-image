/**
 * Web Worker for background segmentation processing
 * Handles model initialization and image processing in a separate thread
 */

import { buildRemoveBackgroundConfig } from '../core/model-config'
import type { SegmentationProgress } from '../core/segmentation-worker'
import { formatBytes } from '../core/utils'

/**
 * Progress tracking state
 */
interface ProgressState {
  fileProgress: Record<string, { current: number; total: number }>
  totalDownloaded: number
  totalExpected: number
  hasStartedDownload: boolean
  downloadComplete: boolean
}

/**
 * Create progress callback for model download
 */
function createProgressCallback(onProgress: (progress: SegmentationProgress) => void, state: ProgressState): (key: string, current: number, total: number) => void {
  return (key: string, current: number, total: number) => {
    if (!state.hasStartedDownload) {
      state.hasStartedDownload = true
    }

    // If download is already complete, don't update progress (to preserve isInitializing state)
    if (state.downloadComplete) {
      return
    }

    state.fileProgress[key] = { current, total }
    state.totalDownloaded = Object.values(state.fileProgress).reduce((sum, p) => sum + p.current, 0)
    state.totalExpected = Object.values(state.fileProgress).reduce((sum, p) => sum + p.total, 0)

    const allFilesComplete = Object.values(state.fileProgress).every((p) => p.current === p.total && p.total > 0)

    if (allFilesComplete && state.totalExpected > 0) {
      state.downloadComplete = true
      onProgress({
        progress: 100,
        status: `Model files downloaded: ${formatBytes(state.totalExpected)} / ${formatBytes(state.totalExpected)}`,
        downloadedBytes: state.totalExpected,
        totalBytes: state.totalExpected,
        isInitializing: true,
      })
    } else if (state.totalExpected > 0 && state.totalDownloaded >= state.totalExpected) {
      // Ensure 100% when download is complete, show initializing status
      state.downloadComplete = true
      onProgress({
        progress: 100,
        status: `Model files downloaded: ${formatBytes(state.totalExpected)} / ${formatBytes(state.totalExpected)}`,
        downloadedBytes: state.totalExpected,
        totalBytes: state.totalExpected,
        isInitializing: true,
      })
    } else if (state.totalExpected > 0 && state.totalDownloaded < state.totalExpected) {
      const downloadPercentage = (state.totalDownloaded / state.totalExpected) * 100
      onProgress({
        progress: downloadPercentage,
        status: `Downloading model files: ${formatBytes(state.totalDownloaded)} / ${formatBytes(state.totalExpected)}`,
        downloadedBytes: state.totalDownloaded,
        totalBytes: state.totalExpected,
      })
    }
  }
}

/** IndexedDB cache utilities */
const DB_NAME = 'progress-models'
const DB_VERSION = 1
const STORE_NAME = 'model-files'

interface CacheEntry {
  url: string
  data: ArrayBuffer
  timestamp: number
  size: number
}

/** Open IndexedDB database */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/** Get cached file from IndexedDB */
async function getCachedFile(url: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(url)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        if (entry && entry.data) {
          resolve(entry.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to get cached file from IndexedDB:', error)
    return null
  }
}

/** Cache file to IndexedDB */
async function cacheFile(url: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const entry: CacheEntry = {
      url,
      data,
      timestamp: Date.now(),
      size: data.byteLength,
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to cache file to IndexedDB:', error)
  }
}

/** Setup fetch interceptor with IndexedDB cache */
function setupCachedFetch(): void {
  const originalFetch = self.fetch

  self.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    // Only intercept model files (onnx, wasm, bin, etc.)
    const isModelFile = /\.(onnx|wasm|bin|model)$/i.test(url) || url.includes('model') || url.includes('onnx')

    if (isModelFile) {
      // Try to get from IndexedDB cache first
      const cachedData = await getCachedFile(url)
      if (cachedData) {
        // Return cached data as Response
        return new Response(cachedData, {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Cache': 'IndexedDB',
          },
        })
      }

      // If not cached, fetch from network
      try {
        const response = await originalFetch(input, init)
        if (response.ok) {
          // Clone response to read and cache
          const clonedResponse = response.clone()
          const arrayBuffer = await clonedResponse.arrayBuffer()

          // Cache to IndexedDB (don't await to avoid blocking)
          cacheFile(url, arrayBuffer).catch((error) => {
            // eslint-disable-next-line no-console
            console.warn('Failed to cache file:', error)
          })

          // Return original response
          return response
        }
        return response
      } catch (error) {
        // If network fails, try cache one more time
        const cachedData = await getCachedFile(url)
        if (cachedData) {
          return new Response(cachedData, {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/octet-stream',
              'X-Cache': 'IndexedDB-Fallback',
            },
          })
        }
        throw error
      }
    }

    // For non-model files, use original fetch
    return originalFetch(input, init)
  }
}

// Setup fetch interceptor when worker loads (must execute before any fetch calls)
setupCachedFetch()

/** Apply edge feathering */
function applyFeather(imageData: ImageData, radius: number): ImageData {
  const { width, height, data } = imageData
  const result = new ImageData(width, height)
  result.data.set(data)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const alpha = data[idx + 3]

      if (alpha > 0 && alpha < 255) {
        let sumAlpha = 0
        let count = 0

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx
            const ny = y + dy

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4
              sumAlpha += data[nIdx + 3]
              count++
            }
          }
        }

        const avgAlpha = sumAlpha / count
        result.data[idx + 3] = Math.round(avgAlpha)
      }
    }
  }

  return result
}

/** Smooth edges */
function smoothEdges(imageData: ImageData, iterations = 1): ImageData {
  let result = new ImageData(imageData.width, imageData.height)
  result.data.set(imageData.data)

  for (let iter = 0; iter < iterations; iter++) {
    const temp = new ImageData(result.width, result.height)
    const { width, height, data } = result

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        let sumAlpha = 0
        let count = 0

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4
            sumAlpha += data[nIdx + 3]
            count++
          }
        }

        const avgAlpha = sumAlpha / count
        temp.data[idx] = data[idx]
        temp.data[idx + 1] = data[idx + 1]
        temp.data[idx + 2] = data[idx + 2]
        temp.data[idx + 3] = Math.round(avgAlpha)
      }
    }

    result = temp
  }

  return result
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

let removeBackground: ((input: Blob, config?: any) => Promise<Blob>) | null = null
let isModelInitialized = false

/** Initialize the background removal model */
async function initializeModel(onProgress: (progress: SegmentationProgress) => void): Promise<boolean> {
  try {
    if (isModelInitialized) {
      return true
    }

    /** Dynamically import @imgly/background-removal */
    const module = await import('@imgly/background-removal')
    removeBackground = module.removeBackground

    /** Track download progress */
    const progressState: ProgressState = {
      fileProgress: {},
      totalDownloaded: 0,
      totalExpected: 0,
      hasStartedDownload: false,
      downloadComplete: false,
    }

    const progressCallback = createProgressCallback(onProgress, progressState)

    // Only show initialization message if download hasn't started yet
    if (!progressState.hasStartedDownload) {
      onProgress({ progress: 0, status: 'Initializing AI model...', downloadedBytes: 0, totalBytes: 0 })
    }

    /** Create a minimal test image to trigger model download */
    const testImageData = new ImageData(64, 64)
    const testData = testImageData.data
    for (let i = 0; i < testData.length; i += 4) {
      const x = (i / 4) % 64
      const y = Math.floor(i / 4 / 64)
      const isBlack = x >= 16 && x < 48 && y >= 16 && y < 48
      testData[i] = isBlack ? 0 : 255 // R
      testData[i + 1] = isBlack ? 0 : 255 // G
      testData[i + 2] = isBlack ? 0 : 255 // B
      testData[i + 3] = 255 // A
    }

    /** Convert ImageData to Blob */
    const testCanvas = new OffscreenCanvas(64, 64)
    const testCtx = testCanvas.getContext('2d')
    if (!testCtx) return false

    testCtx.putImageData(testImageData, 0, 0)
    const testBlob = await testCanvas.convertToBlob({ type: 'image/png' })
    if (!testBlob) return false

    const config = buildRemoveBackgroundConfig('medium', progressCallback)

    // If download is complete, show initializing status
    if (progressState.hasStartedDownload && progressState.totalExpected > 0 && progressState.totalDownloaded >= progressState.totalExpected) {
      onProgress({
        progress: 100,
        status: 'Model files downloaded',
        downloadedBytes: progressState.totalExpected,
        totalBytes: progressState.totalExpected,
        isInitializing: true,
      })
    }

    await removeBackground(testBlob, config)

    if (!progressState.hasStartedDownload || (progressState.totalExpected > 0 && progressState.totalDownloaded >= progressState.totalExpected)) {
      onProgress({
        progress: 100,
        status: 'AI model ready',
        downloadedBytes: progressState.totalExpected || 0,
        totalBytes: progressState.totalExpected || 0,
        isInitializing: false,
      })
    }

    isModelInitialized = true
    return true
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Model initialization failed in worker:', error)
    return false
  }
}

/** Process image for background removal */
async function processImage(imageData: ImageData, onProgress: (progress: SegmentationProgress) => void): Promise<ImageData | null> {
  try {
    if (!removeBackground) {
      throw new Error('Model not initialized')
    }

    /** Convert ImageData to Blob */
    const canvas = new OffscreenCanvas(imageData.width, imageData.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.putImageData(imageData, 0, 0)
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    if (!blob) return null

    /** Track download progress */
    const progressState: ProgressState = {
      fileProgress: {},
      totalDownloaded: 0,
      totalExpected: 0,
      hasStartedDownload: false,
      downloadComplete: false,
    }

    const progressCallback = createProgressCallback(onProgress, progressState)

    // Only show initialization message if download hasn't started yet
    if (!progressState.hasStartedDownload) {
      onProgress({ progress: 0, status: 'Initializing AI model...', downloadedBytes: 0, totalBytes: 0 })
    }

    const config = buildRemoveBackgroundConfig('medium', progressCallback)
    const result = await removeBackground(blob, config)

    // Model processing complete, no longer initializing
    if (progressState.hasStartedDownload && progressState.totalExpected > 0 && progressState.totalDownloaded >= progressState.totalExpected) {
      onProgress({
        progress: 100,
        status: 'Processing complete',
        downloadedBytes: progressState.totalExpected,
        totalBytes: progressState.totalExpected,
        isInitializing: false,
      })
    }

    if (!(result instanceof Blob)) {
      throw new Error('Unexpected return type from removeBackground')
    }

    /** Convert result Blob back to ImageData */
    const imageBitmap = await createImageBitmap(result)
    const resultCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
    const resultCtx = resultCanvas.getContext('2d')
    if (!resultCtx) return null

    resultCtx.drawImage(imageBitmap, 0, 0)
    let resultImageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height)

    imageBitmap.close()

    /** Apply edge processing in worker */
    const smoothed = smoothEdges(resultImageData, 1)
    const feathered = applyFeather(smoothed, 1)

    return feathered
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Image processing failed in worker:', error)
    return null
  }
}

/** Check if auto segmentation is supported */
async function checkSupport(): Promise<boolean> {
  try {
    await import('@imgly/background-removal')
    return true
  } catch {
    return false
  }
}

/** Handle messages from main thread */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'CHECK_SUPPORT': {
        const supported = await checkSupport()
        self.postMessage({ type: 'SUPPORT', payload: { supported } } as WorkerResponse)
        break
      }

      case 'INIT_MODEL': {
        const progressCallback = (progress: SegmentationProgress) => {
          self.postMessage({ type: 'PROGRESS', payload: progress } as WorkerResponse)
        }

        const success = await initializeModel(progressCallback)
        self.postMessage({ type: 'RESULT', payload: { success } } as WorkerResponse)
        break
      }

      case 'PROCESS_IMAGE': {
        const { imageData } = payload as { imageData: ImageData }

        const progressCallback = (progress: SegmentationProgress) => {
          self.postMessage({ type: 'PROGRESS', payload: progress } as WorkerResponse)
        }

        const result = await processImage(imageData, progressCallback)
        self.postMessage({ type: 'RESULT', payload: { imageData: result } } as WorkerResponse)
        break
      }

      default:
        self.postMessage({ type: 'ERROR', payload: { error: 'Unknown message type' } } as WorkerResponse)
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : String(error) },
    } as WorkerResponse)
  }
})
