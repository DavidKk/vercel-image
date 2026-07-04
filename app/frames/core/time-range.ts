import type { ResolvedTimeRange } from './types'

/**
 * Parse a time input string to a number in milliseconds
 * @param input Time string in milliseconds (may be negative)
 * @returns Parsed number or NaN
 */
export function parseTimeInput(input: string): number {
  const trimmed = input.trim()
  if (trimmed === '' || trimmed === '-') return 0
  return Number(trimmed)
}

/**
 * Resolve a time offset relative to video duration
 * Negative values count from the end (e.g. -10000 = duration - 10s)
 * @param valueMs Time in milliseconds (may be negative)
 * @param durationMs Video duration in milliseconds
 * @returns Absolute time in milliseconds clamped to [0, durationMs]
 */
export function resolveTimeOffset(valueMs: number, durationMs: number): number {
  const absolute = valueMs < 0 ? durationMs + valueMs : valueMs
  return Math.max(0, Math.min(durationMs, absolute))
}

/**
 * Resolve start/end inputs into an absolute time range in milliseconds
 * @param startInput Start time input string (ms)
 * @param endInput End time input string (ms)
 * @param durationSeconds Video duration in seconds (from HTMLVideoElement)
 * @returns Resolved start and end in milliseconds
 */
export function resolveTimeRange(startInput: string, endInput: string, durationSeconds: number): ResolvedTimeRange {
  const durationMs = durationSeconds * 1000
  const startRaw = parseTimeInput(startInput)
  const endRaw = parseTimeInput(endInput)

  let start = resolveTimeOffset(Number.isFinite(startRaw) ? startRaw : 0, durationMs)
  let end = resolveTimeOffset(Number.isFinite(endRaw) ? endRaw : 0, durationMs)

  /** Treat end=0 as video end when start is not at end */
  if (endRaw === 0 && endInput.trim() === '0' && start < durationMs) {
    end = durationMs
  }

  if (start > end) {
    const swap = start
    start = end
    end = swap
  }

  return { start, end }
}

/**
 * Format milliseconds for display
 * @param ms Time in milliseconds
 * @returns Formatted string with ms unit
 */
export function formatTimeMs(ms: number): string {
  return `${Math.round(ms)}ms`
}

/**
 * Convert video duration in seconds to milliseconds
 * @param durationSeconds Duration from HTMLVideoElement
 * @returns Duration in milliseconds
 */
export function durationToMs(durationSeconds: number): number {
  return Math.round(durationSeconds * 1000)
}
