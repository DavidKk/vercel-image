import type { ResolvedTimeRange } from './types'

/**
 * Build a list of timestamps to sample between start and end
 * @param range Resolved time range in milliseconds
 * @param intervalMs Milliseconds between frames
 * @param maxFrames Maximum number of frames
 * @returns Array of timestamps in milliseconds
 */
export function buildFrameTimestamps(range: ResolvedTimeRange, intervalMs: number, maxFrames: number): number[] {
  const step = Math.max(intervalMs, 1)
  const timestamps: number[] = []

  for (let t = range.start; t < range.end && timestamps.length < maxFrames; t += step) {
    timestamps.push(Math.round(t))
  }

  return timestamps
}

/**
 * Estimate how many frames will be extracted
 * @param range Resolved time range in milliseconds
 * @param intervalMs Interval in milliseconds
 * @param maxFrames Maximum cap
 * @returns Estimated frame count
 */
export function estimateFrameCount(range: ResolvedTimeRange, intervalMs: number, maxFrames: number): number {
  return buildFrameTimestamps(range, intervalMs, maxFrames).length
}

/**
 * Compute scaled dimensions preserving aspect ratio
 * @param width Original width
 * @param height Original height
 * @param maxDimension Max width or height (0 = no scaling)
 * @returns Scaled width and height
 */
export function computeScaledSize(width: number, height: number, maxDimension: number): { width: number; height: number } {
  if (maxDimension <= 0 || (width <= maxDimension && height <= maxDimension)) {
    return { width, height }
  }

  const scale = maxDimension / Math.max(width, height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}
