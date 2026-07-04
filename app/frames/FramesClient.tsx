'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PreviewPane } from '@/app/progress/components/PreviewPane'
import { downloadImage } from '@/app/progress/core/image-utils'
import { Slider } from '@/components/Slider'

import { FramePreviewGrid } from './components/FramePreviewGrid'
import { GifPreview } from './components/GifPreview'
import { buildFrameTimestamps, estimateFrameCount } from './core/frame-scheduler'
import { getMergedGifFilename, mergeFramesToGif } from './core/gif-merge'
import { durationToMs, formatTimeMs, resolveTimeRange } from './core/time-range'
import { DEFAULT_EXTRACTION_SETTINGS, type ExtractedFrame, type FrameExtractionSettings, type VideoSource } from './core/types'
import { disposeExtractedFrames, disposeVideoSource, extractVideoFrames, loadVideoFile } from './core/video-frame-extractor'

type ViewMode = 'grid' | 'detail' | 'gif'

interface GifPreviewState {
  url: string
  blob: Blob
  sizeBytes: number
}

export function FramesClient() {
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null)
  const [frames, setFrames] = useState<ExtractedFrame[]>([])
  const [settings, setSettings] = useState<FrameExtractionSettings>(DEFAULT_EXTRACTION_SETTINGS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [extractProgress, setExtractProgress] = useState({ current: 0, total: 0, status: '' })
  const [isDragging, setIsDragging] = useState(false)
  const [gifPreview, setGifPreview] = useState<GifPreviewState | null>(null)
  const videoSourceRef = useRef<VideoSource | null>(null)
  const framesRef = useRef<ExtractedFrame[]>([])

  useEffect(() => {
    framesRef.current = frames
  }, [frames])

  const gifPreviewRef = useRef<GifPreviewState | null>(null)

  useEffect(() => {
    gifPreviewRef.current = gifPreview
  }, [gifPreview])

  /** Revoke GIF preview URL on unmount */
  useEffect(() => {
    return () => {
      if (gifPreviewRef.current?.url) {
        URL.revokeObjectURL(gifPreviewRef.current.url)
      }
    }
  }, [])

  /**
   * Clear generated GIF preview and release object URL
   */
  const clearGifPreview = useCallback(() => {
    setGifPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])
  useEffect(() => {
    return () => {
      if (videoSourceRef.current) {
        disposeVideoSource(videoSourceRef.current)
      }
      disposeExtractedFrames(framesRef.current)
    }
  }, [])
  const selectedFrame = useMemo(() => frames.find((f) => f.id === selectedId) ?? null, [frames, selectedId])

  const resolvedRange = useMemo(() => {
    if (!videoSource) return null
    return resolveTimeRange(settings.startInput, settings.endInput, videoSource.duration)
  }, [videoSource, settings.startInput, settings.endInput])

  const estimatedCount = useMemo(() => {
    if (!resolvedRange) return 0
    return estimateFrameCount(resolvedRange, settings.intervalMs, settings.maxFrames)
  }, [resolvedRange, settings.intervalMs, settings.maxFrames])
  const loadVideo = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('video/')) return

      if (videoSourceRef.current) {
        disposeVideoSource(videoSourceRef.current)
      }
      disposeExtractedFrames(frames)

      try {
        const source = await loadVideoFile(file)
        videoSourceRef.current = source
        setVideoSource(source)
        setFrames([])
        setSelectedId(null)
        setViewMode('grid')
        clearGifPreview()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load video:', error)
      }
    },
    [frames, clearGifPreview]
  )

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) await loadVideo(file)
      e.target.value = ''
    },
    [loadVideo]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) await loadVideo(file)
    },
    [loadVideo]
  )

  /** Extract frames from loaded video */
  const handleExtract = useCallback(async () => {
    if (!videoSource || !resolvedRange) return

    const timestamps = buildFrameTimestamps(resolvedRange, settings.intervalMs, settings.maxFrames)
    if (timestamps.length === 0) return

    disposeExtractedFrames(frames)
    clearGifPreview()
    setIsExtracting(true)
    setFrames([])
    setSelectedId(null)

    try {
      const extracted = await extractVideoFrames(videoSource, timestamps, settings.maxDimension, (progress) => {
        setExtractProgress(progress)
      })
      setFrames(extracted)
      if (extracted.length > 0) {
        setSelectedId(extracted[0].id)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Frame extraction failed:', error)
    } finally {
      setIsExtracting(false)
      setExtractProgress({ current: 0, total: 0, status: '' })
    }
  }, [videoSource, resolvedRange, settings, frames, clearGifPreview])

  /** Generate GIF and show preview */
  const handleGenerateGif = useCallback(async () => {
    if (frames.length === 0) return

    setIsMerging(true)
    try {
      const blob = mergeFramesToGif(frames, { intervalMs: settings.intervalMs, loop: true })
      clearGifPreview()
      const url = URL.createObjectURL(blob)
      setGifPreview({ url, blob, sizeBytes: blob.size })
      setViewMode('gif')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('GIF merge failed:', error)
    } finally {
      setIsMerging(false)
    }
  }, [frames, settings.intervalMs, clearGifPreview])

  /** Download the generated GIF */
  const handleDownloadGif = useCallback(() => {
    if (!gifPreview || !videoSource) return
    downloadImage(gifPreview.blob, getMergedGifFilename(videoSource.file.name))
  }, [gifPreview, videoSource])

  const updateSetting = useCallback(
    <K extends keyof FrameExtractionSettings>(key: K, value: FrameExtractionSettings[K]) => {
      setSettings((prev) => {
        if (key === 'intervalMs' && prev.intervalMs !== value) {
          clearGifPreview()
        }
        return { ...prev, [key]: value }
      })
    },
    [clearGifPreview]
  )

  const isBusy = isExtracting || isMerging

  return (
    <div className="bg-gray-100" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="flex h-full">
        {/* Left panel */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div>
              <input type="file" accept="video/*" onChange={handleFileUpload} disabled={isBusy} className="hidden" id="video-upload" />
              <label
                htmlFor="video-upload"
                className={`flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all border border-gray-300 cursor-pointer ${
                  isBusy ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Select Video
              </label>
            </div>

            {videoSource && (
              <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="font-medium text-gray-700 truncate">{videoSource.file.name}</p>
                <p>
                  {videoSource.width}×{videoSource.height} · {formatTimeMs(durationToMs(videoSource.duration))}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Extraction</h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="start-time" className="block text-xs font-medium text-gray-600 mb-1">
                    Start (ms)
                  </label>
                  <input
                    id="start-time"
                    type="text"
                    value={settings.startInput}
                    onChange={(e) => updateSetting('startInput', e.target.value)}
                    disabled={!videoSource || isBusy}
                    placeholder="0"
                    className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-xs font-medium text-gray-600 mb-1">
                    End (ms)
                  </label>
                  <input
                    id="end-time"
                    type="text"
                    value={settings.endInput}
                    onChange={(e) => updateSetting('endInput', e.target.value)}
                    disabled={!videoSource || isBusy}
                    placeholder="0 = end"
                    className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Negative = from end (e.g. -10000 = last 10000ms). End 0 = video end.</p>

              {resolvedRange && videoSource && (
                <p className="text-xs text-indigo-600">
                  Range: {formatTimeMs(resolvedRange.start)} → {formatTimeMs(resolvedRange.end)}
                </p>
              )}

              <div>
                <label htmlFor="interval-ms" className="block text-xs font-medium text-gray-600 mb-1">
                  Interval: {settings.intervalMs}ms (~{(1000 / settings.intervalMs).toFixed(1)} fps)
                </label>
                <Slider
                  id="interval-ms"
                  min={33}
                  max={2000}
                  step={33}
                  value={settings.intervalMs}
                  onChange={(intervalMs) => updateSetting('intervalMs', intervalMs)}
                  disabled={!videoSource || isBusy}
                />
              </div>

              <div>
                <label htmlFor="max-frames" className="block text-xs font-medium text-gray-600 mb-1">
                  Max frames: {settings.maxFrames}
                </label>
                <Slider
                  id="max-frames"
                  min={10}
                  max={500}
                  step={10}
                  value={settings.maxFrames}
                  onChange={(maxFrames) => updateSetting('maxFrames', maxFrames)}
                  disabled={!videoSource || isBusy}
                />
              </div>

              <div>
                <label htmlFor="max-dimension" className="block text-xs font-medium text-gray-600 mb-1">
                  Max size: {settings.maxDimension}px
                </label>
                <Slider
                  id="max-dimension"
                  min={256}
                  max={2048}
                  step={128}
                  value={settings.maxDimension}
                  onChange={(maxDimension) => updateSetting('maxDimension', maxDimension)}
                  disabled={!videoSource || isBusy}
                />
              </div>

              {estimatedCount > 0 && (
                <p className="text-xs text-gray-600">
                  Estimated: <span className="font-semibold">{estimatedCount}</span> frames
                </p>
              )}
            </div>

            <button
              onClick={handleExtract}
              disabled={!videoSource || isBusy || estimatedCount === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 shadow-md"
            >
              {isExtracting ? `Extracting ${extractProgress.current}/${extractProgress.total}...` : 'Extract Frames'}
            </button>

            {frames.length > 0 && (
              <>
                <button
                  onClick={handleGenerateGif}
                  disabled={isBusy}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 shadow-md"
                >
                  {isMerging ? 'Generating GIF...' : `Generate GIF (${frames.length} frames)`}
                </button>

                {gifPreview && (
                  <button
                    onClick={handleDownloadGif}
                    disabled={isBusy}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 shadow-md"
                  >
                    Download GIF
                  </button>
                )}

                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 py-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedId && setViewMode('detail')}
                    disabled={!selectedId}
                    className={`flex-1 py-2 text-sm font-medium disabled:opacity-50 ${viewMode === 'detail' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => gifPreview && setViewMode('gif')}
                    disabled={!gifPreview}
                    className={`flex-1 py-2 text-sm font-medium disabled:opacity-50 ${viewMode === 'gif' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                  >
                    GIF
                  </button>
                </div>

                {gifPreview && viewMode !== 'gif' && <p className="text-xs text-amber-600 text-center">GIF ready — open GIF tab to preview</p>}

                <p className="text-xs text-gray-500 text-center">{frames.length} frames extracted</p>
              </>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden relative">
          {isExtracting && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white rounded-lg shadow-lg px-4 py-2 text-sm text-gray-700">
              {extractProgress.status || `Extracting ${extractProgress.current}/${extractProgress.total}...`}
            </div>
          )}

          {!videoSource ? (
            <div
              onDrop={isBusy ? undefined : handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                if (!isBusy) setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              className="flex-1 flex items-center justify-center p-6"
            >
              <label
                htmlFor="video-upload"
                className={`flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-2xl w-full max-w-md cursor-pointer transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-300 bg-white hover:border-indigo-400'
                }`}
              >
                <span className="font-semibold text-xl text-gray-700">Select Video</span>
                <span className="text-xs text-gray-500 mt-2 text-center">MP4, WebM — extract frames and merge to GIF</span>
              </label>
            </div>
          ) : frames.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <video src={videoSource.url} controls className="max-w-full max-h-[50vh] rounded-lg shadow-lg bg-black" />
              <p className="text-sm text-gray-500">Configure range and click Extract Frames</p>
            </div>
          ) : viewMode === 'gif' && gifPreview ? (
            <GifPreview previewUrl={gifPreview.url} frameCount={frames.length} intervalMs={settings.intervalMs} sizeBytes={gifPreview.sizeBytes} />
          ) : viewMode === 'grid' ? (
            <FramePreviewGrid
              frames={frames}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id)
                setViewMode('detail')
              }}
            />
          ) : selectedFrame ? (
            <PreviewPane image={selectedFrame.image} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
