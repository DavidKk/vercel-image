/**
 * Job queue types for Studio operations
 */

/** Supported operation types */
export type JobType = 'removeBackground' | 'convertFormat' | 'extractFrames' | 'composeGif' | 'composeSprite' | 'addText'

/** Job lifecycle status */
export type JobStatus = 'pending' | 'running' | 'done' | 'error' | 'cancelled'

/**
 * A queued processing job
 */
export interface StudioJob {
  /** Unique job identifier */
  id: string
  /** Operation type */
  type: JobType
  /** Input asset ids */
  inputAssetIds: string[]
  /** Operation-specific config */
  config: Record<string, unknown>
  /** Current status */
  status: JobStatus
  /** Progress 0-100 */
  progress: number
  /** Human-readable status message */
  message: string
  /** Error message when failed */
  error?: string
  /** Output asset ids produced by this job */
  outputAssetIds: string[]
  /** Creation timestamp */
  createdAt: number
}
