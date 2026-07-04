/**
 * Configuration types and builders for @imgly/background-removal
 */

/** ONNX model variant */
export type BackgroundRemovalModel = 'isnet' | 'isnet_fp16' | 'isnet_quint8'

/** Execution device */
export type ProcessingDevice = 'cpu' | 'gpu'

/** Library processing mode */
export type ProcessingMode = 'removeBackground' | 'removeForeground' | 'segmentForeground'

/** Output image format */
export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/x-rgba8' | 'image/x-alpha8'

/**
 * User-facing processing configuration (serializable, safe to pass to Worker)
 */
export interface BackgroundRemovalUserConfig {
  /** ONNX model to use */
  model: BackgroundRemovalModel
  /** CPU or GPU (WebGPU) execution */
  device: ProcessingDevice
  /** Processing mode */
  mode: ProcessingMode
  /** Enable library debug logging */
  debug: boolean
  /** Rescale large images before inference */
  rescale: boolean
  /** Delegate inference to library's internal worker */
  proxyToWorker: boolean
  /** Output image format */
  outputFormat: OutputFormat
  /** Output quality for JPEG/WebP (0–1) */
  outputQuality: number
  /** Edge smoothing iterations (0 to disable) */
  edgeSmooth: number
  /** Edge feather radius (0 to disable) */
  edgeFeather: number
}

/** Default user configuration */
export const DEFAULT_BACKGROUND_REMOVAL_CONFIG: BackgroundRemovalUserConfig = {
  model: 'isnet_fp16',
  device: 'gpu',
  mode: 'removeBackground',
  debug: false,
  rescale: true,
  proxyToWorker: false,
  outputFormat: 'image/webp',
  outputQuality: 0.8,
  edgeSmooth: 1,
  edgeFeather: 1,
}

/**
 * Check whether WebGPU is available in the current browser
 * @returns True when WebGPU adapter can be acquired
 */
export async function isWebGpuSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return false
  }

  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
    if (!gpu) return false
    const adapter = await gpu.requestAdapter()
    return adapter !== null
  } catch {
    return false
  }
}

/**
 * Resolve default processing device, preferring GPU when supported
 * @returns CPU or GPU device string
 */
export async function resolveDefaultDevice(): Promise<ProcessingDevice> {
  const gpuSupported = await isWebGpuSupported()
  return gpuSupported ? 'gpu' : 'cpu'
}

/**
 * Build default config with runtime device detection
 * @returns Default configuration with GPU when available
 */
export async function createDefaultProcessingConfig(): Promise<BackgroundRemovalUserConfig> {
  const device = await resolveDefaultDevice()
  return {
    ...DEFAULT_BACKGROUND_REMOVAL_CONFIG,
    device,
  }
}

/** Model option metadata for UI */
export const MODEL_OPTIONS: { value: BackgroundRemovalModel; label: string; description: string }[] = [
  { value: 'isnet_quint8', label: 'Fast (quantized)', description: '~40 MB, fastest, may have edge artifacts' },
  { value: 'isnet_fp16', label: 'Balanced (fp16)', description: '~80 MB, default, good quality' },
  { value: 'isnet', label: 'Best quality (fp32)', description: 'Largest, slowest, best edges' },
]

/** Processing mode metadata for UI */
export const MODE_OPTIONS: { value: ProcessingMode; label: string; description: string }[] = [
  { value: 'removeBackground', label: 'Remove Background', description: 'Keep foreground, transparent background' },
  { value: 'removeForeground', label: 'Remove Foreground', description: 'Keep background, remove subject' },
  { value: 'segmentForeground', label: 'Alpha Mask', description: 'Output segmentation mask only' },
]

/** Output format metadata for UI */
export const OUTPUT_FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/x-rgba8', label: 'RGBA8 (raw)' },
  { value: 'image/x-alpha8', label: 'Alpha8 (mask)' },
]

/**
 * Build a stable key for model cache invalidation
 * @param config User configuration
 * @returns Cache key string
 */
export function getModelCacheKey(config: BackgroundRemovalUserConfig): string {
  return `${config.model}:${config.device}`
}

/**
 * Get custom public path from environment variable
 * @returns Public path or undefined
 */
export function getPublicPathFromEnv(): string | undefined {
  return process.env.NEXT_PUBLIC_BG_REMOVAL_MODEL_PATH || undefined
}

/**
 * Build @imgly/background-removal library config from user settings
 * @param userConfig User-facing configuration
 * @param progress Optional download progress callback
 * @returns Library-compatible config object
 */
export function buildLibraryConfig(userConfig: BackgroundRemovalUserConfig, progress?: (key: string, current: number, total: number) => void) {
  const publicPath = getPublicPathFromEnv()

  const options: Record<string, unknown> = {
    model: userConfig.model,
    device: userConfig.device,
    debug: userConfig.debug,
    rescale: userConfig.rescale,
    proxyToWorker: userConfig.proxyToWorker,
    output: {
      format: userConfig.outputFormat,
      quality: userConfig.outputQuality,
    },
  }

  if (publicPath) {
    options.publicPath = publicPath
  }

  if (progress) {
    options.progress = progress
  }

  return options
}

/**
 * Get file extension for processed output
 * @param format Output format
 * @returns File extension without dot
 */
export function getOutputExtension(format: OutputFormat): string {
  switch (format) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/x-rgba8':
    case 'image/x-alpha8':
      return 'png'
    default:
      return 'png'
  }
}

/**
 * Get human-readable label for processing mode
 * @param mode Processing mode
 * @returns Display label
 */
export function getProcessingModeLabel(mode: ProcessingMode): string {
  return MODE_OPTIONS.find((o) => o.value === mode)?.label ?? 'Process'
}
