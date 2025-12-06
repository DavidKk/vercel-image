/**
 * Model configuration
 * Used to customize @imgly/background-removal model file paths
 */

export interface ModelConfig {
  /**
   * Custom base path for model files
   * Example: 'https://your-cdn.com/models/' or '/models/'
   * If undefined, uses the default CDN address
   */
  publicPath?: string
}

/**
 * Model configuration notes:
 * - @imgly/background-removal-data@1.7.0 is not available on npm/jsdelivr/unpkg (latest npm version is 1.4.5)
 * - Only the official CDN (staticimgly.com) provides version 1.7.0
 * - The model itself has no geographical restrictions, all users can use it
 * - Use official CDN as default configuration
 */

/**
 * Default configuration
 * Uses official CDN (staticimgly.com)
 */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  publicPath: undefined, // undefined means use library's default CDN (official staticimgly.com)
}

/**
 * Get model configuration
 * Defaults to official CDN
 * Can be customized via environment variable NEXT_PUBLIC_BG_REMOVAL_MODEL_PATH
 */
export function getModelConfig(): ModelConfig {
  // Read from environment variable (if set)
  const publicPath = process.env.NEXT_PUBLIC_BG_REMOVAL_MODEL_PATH || DEFAULT_MODEL_CONFIG.publicPath

  return {
    publicPath,
  }
}

/**
 * Build removeBackground configuration options
 */
export function buildRemoveBackgroundConfig(model: 'small' | 'medium' | 'large' = 'medium', progress?: (key: string, current: number, total: number) => void) {
  const config = getModelConfig()

  const options: {
    model: 'small' | 'medium' | 'large'
    outputFormat: string
    publicPath?: string
    debug?: boolean
    progress?: (key: string, current: number, total: number) => void
  } = {
    model,
    outputFormat: 'image/png',
  }

  // If custom path is configured, add to options
  if (config.publicPath) {
    options.publicPath = config.publicPath
  }

  // Add official progress callback
  if (progress) {
    options.progress = progress
  }

  return options
}
