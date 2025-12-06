'use client'

import { useCallback, useEffect, useState } from 'react'

import { PreviewPane } from './components/PreviewPane'
import { ProgressBar } from './components/ProgressBar'
import { canvasToBlob, createCanvasFromImage, createCanvasFromImageData, createImageDataFromImage, downloadImage, fileToImage } from './core/image-utils'
import { autoSegmentPerson, checkAutoSegmentSupport, initializeModel, type SegmentationProgress } from './core/segmentation-worker'

export function ProgressClient() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null)
  const [autoSegmentSupported, setAutoSegmentSupported] = useState(false)
  const [isAutoSegmenting, setIsAutoSegmenting] = useState(false)
  const [isModelInitializing, setIsModelInitializing] = useState(false)
  const [progress, setProgress] = useState<SegmentationProgress>({ progress: 0, status: '' })
  const [showProgress, setShowProgress] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  /** Check auto-segmentation support and initialize model */
  useEffect(() => {
    let mounted = true

    const init = async () => {
      const supported = await checkAutoSegmentSupport()
      if (!mounted) return

      setAutoSegmentSupported(supported)

      if (supported) {
        /** Preload model */
        setIsModelInitializing(true)
        let hasStartedDownload = false

        const ready = await initializeModel((progress) => {
          if (mounted) {
            setProgress(progress)
            /** If progress callback is called, download has started */
            if (progress.downloadedBytes !== undefined && progress.downloadedBytes > 0) {
              if (!hasStartedDownload) {
                hasStartedDownload = true
                setShowProgress(true)
                setIsDownloading(true)
              }
            }
            /** If download is complete (progress === 100), allow usage but don't hide progress bar immediately */
            if (progress.progress === 100) {
              setIsDownloading(false)
            }
          }
        })

        if (mounted) {
          setIsModelInitializing(false)
          /** If model is ready and download hasn't started (cached), ensure download state is complete and don't show progress bar */
          if (ready && !hasStartedDownload) {
            setIsDownloading(false)
            setShowProgress(false)
          }
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  /** Hide progress bar when download is complete (100%) and not initializing */
  useEffect(() => {
    if (progress.progress === 100 && !progress.isInitializing) {
      setShowProgress(false)
    }
  }, [progress.progress, progress.isInitializing])

  /** Auto AI segmentation for person */
  const handleAutoSegment = useCallback(async () => {
    if (!image || !autoSegmentSupported) {
      // eslint-disable-next-line no-console
      console.warn('Auto segmentation not available:', { image: !!image, autoSegmentSupported })
      return
    }

    setIsAutoSegmenting(true)

    try {
      /** Convert image to ImageData for worker */
      const imageData = createImageDataFromImage(image)

      /** Process image without showing progress bar */
      const segmentedData = await autoSegmentPerson(imageData)

      if (segmentedData) {
        /** Edge processing is done in worker, use result directly */
        setProcessedImageData(segmentedData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Auto segmentation failed:', error)
    } finally {
      setIsAutoSegmenting(false)
    }
  }, [image, autoSegmentSupported])

  /** Process file */
  const processFile = useCallback(async (file: File) => {
    try {
      const img = await fileToImage(file)
      setImage(img)
      /** Clear previous processing result when selecting new image */
      setProcessedImageData(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Image loading failed:', error)
    }
  }, [])

  /** Handle file upload */
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await processFile(file)
    },
    [processFile]
  )

  /** Handle drag and drop upload */
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        await processFile(file)
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!isDownloading && !isModelInitializing) {
        setIsDragging(true)
      }
    },
    [isDownloading, isModelInitializing]
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!isDownloading && !isModelInitializing) {
        setIsDragging(true)
      }
    },
    [isDownloading, isModelInitializing]
  )

  /** Download processed image or original image */
  const handleDownload = useCallback(async () => {
    if (processedImageData) {
      // Download processed image
      const canvas = createCanvasFromImageData(processedImageData)
      const blob = await canvasToBlob(canvas)
      downloadImage(blob, 'ai-processed.png')
    } else if (image) {
      // Download original image
      const canvas = createCanvasFromImage(image)
      const blob = await canvasToBlob(canvas)
      downloadImage(blob, 'image.png')
    }
  }, [processedImageData, image])

  return (
    <div className="bg-gray-100" style={{ height: 'calc(100vh - 124px)' }}>
      <div className="flex h-full">
        {/* Left: Control panel */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Control area */}
          <div className="flex-1 p-6 space-y-4">
            {/* Select Image button */}
            <div>
              <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isDownloading || isModelInitializing} className="hidden" id="file-upload" />
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-300 cursor-pointer border border-gray-300 ${
                  isDownloading || isModelInitializing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Select Image
              </label>
            </div>

            {/* AI auto background removal button */}
            {autoSegmentSupported && handleAutoSegment && (
              <button
                onClick={handleAutoSegment}
                disabled={isAutoSegmenting || isDownloading || isModelInitializing || !image}
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isAutoSegmenting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : isModelInitializing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="mr-2 font-bold">AI</span>
                    Initializing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 font-bold">AI</span>
                    Remove Background
                  </span>
                )}
              </button>
            )}

            {/* Download button */}
            {image && (
              <button
                onClick={handleDownload}
                disabled={isDownloading || isModelInitializing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {processedImageData ? 'Download PNG' : 'Download Image'}
                </span>
              </button>
            )}

            {/* Status messages - only show error */}
            {!autoSegmentSupported && (
              <div className="mt-6">
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">AI feature is not available, please check browser support</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Image preview area */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center overflow-hidden relative">
          {/* Backdrop overlay during initialization */}
          {(isModelInitializing || (showProgress && (progress.progress < 100 || progress.isInitializing))) && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
              <div className="w-full max-w-xl px-6">
                <ProgressBar
                  progress={progress.progress}
                  status={progress.status || (isModelInitializing ? 'Initializing AI model...' : '')}
                  isVisible={true}
                  downloadedBytes={progress.downloadedBytes}
                  totalBytes={progress.totalBytes}
                  isInitializing={progress.isInitializing}
                />
              </div>
            </div>
          )}

          {!image ? (
            <div
              onDrop={isDownloading || isModelInitializing ? undefined : handleDrop}
              onDragOver={isDownloading || isModelInitializing ? undefined : handleDragOver}
              onDragEnter={isDownloading || isModelInitializing ? undefined : handleDragEnter}
              onDragLeave={isDownloading || isModelInitializing ? undefined : handleDragLeave}
              className="w-full max-w-md"
            >
              <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isDownloading || isModelInitializing} className="hidden" id="file-upload-preview" />
              <label
                htmlFor="file-upload-preview"
                className={`flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  isDownloading || isModelInitializing
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                    : isDragging
                      ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-lg cursor-pointer'
                      : 'border-gray-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex items-center mb-2">
                  <svg
                    className={`w-5 h-5 mr-2 transition-colors duration-300 ${isDragging ? 'text-indigo-600' : 'text-gray-700'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className={`font-semibold text-xl transition-colors duration-300 ${isDragging ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {isDragging ? 'Drop to upload' : 'Select Image'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{isDragging ? 'Or click here to select file' : 'Supports JPG, PNG, WEBP formats, or drag and drop image here'}</span>
              </label>
            </div>
          ) : (
            <PreviewPane imageData={processedImageData || undefined} image={processedImageData ? undefined : image} />
          )}
        </div>
      </div>
    </div>
  )
}
