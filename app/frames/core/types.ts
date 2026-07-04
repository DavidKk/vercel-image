/**
 * A single frame extracted from a video
 */
export interface ExtractedFrame {
  /** Unique identifier */
  id: string
  /** Timestamp in milliseconds within the source video */
  timestamp: number
  /** Frame index in extraction order */
  index: number
  /** Raw pixel data */
  imageData: ImageData
  /** Preview image element */
  image: HTMLImageElement
}

/**
 * Video metadata loaded from a file
 */
export interface VideoSource {
  /** Source file */
  file: File
  /** Object URL for the video element */
  url: string
  /** HTML video element */
  video: HTMLVideoElement
  /** Duration in seconds */
  duration: number
  /** Native width */
  width: number
  /** Native height */
  height: number
}

/**
 * User settings for frame extraction
 */
export interface FrameExtractionSettings {
  /** Start time input (milliseconds, negative = from end) */
  startInput: string
  /** End time input (milliseconds, negative = from end) */
  endInput: string
  /** Milliseconds between extracted frames */
  intervalMs: number
  /** Maximum number of frames to extract */
  maxFrames: number
  /** Max width/height when scaling frames (0 = no scaling) */
  maxDimension: number
}

/** Default extraction settings */
export const DEFAULT_EXTRACTION_SETTINGS: FrameExtractionSettings = {
  startInput: '0',
  endInput: '0',
  intervalMs: 100,
  maxFrames: 300,
  maxDimension: 1024,
}

/**
 * Resolved time range in milliseconds
 */
export interface ResolvedTimeRange {
  /** Start time in milliseconds */
  start: number
  /** End time in milliseconds */
  end: number
}

/**
 * Extraction progress callback payload
 */
export interface ExtractionProgress {
  /** Current frame index (1-based) */
  current: number
  /** Total frames to extract */
  total: number
  /** Status message */
  status: string
}
