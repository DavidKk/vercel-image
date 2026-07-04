'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiDownload, FiImage, FiX } from 'react-icons/fi'

import { Spinner } from '@/components/Spinner'

import { BatchPreviewGrid } from './components/BatchPreviewGrid'
import { PreviewPane } from './components/PreviewPane'
import { ProcessingSettings } from './components/ProcessingSettings'
import { ProgressBar } from './components/ProgressBar'
import { countByStatus, createImageItemsFromFiles, downloadAllImageItems, downloadImageItem, processImageItem, updateImageItem } from './core/batch-utils'
import { type BackgroundRemovalUserConfig, createDefaultProcessingConfig, DEFAULT_BACKGROUND_REMOVAL_CONFIG, getModelCacheKey, getProcessingModeLabel } from './core/model-config'
import { checkAutoSegmentSupport, initializeModel, type SegmentationProgress } from './core/segmentation-worker'
import type { ImageItem } from './core/types'

type ViewMode = 'grid' | 'detail'

export function ProgressClient() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showProcessed, setShowProcessed] = useState(true)
  const [autoSegmentSupported, setAutoSegmentSupported] = useState(false)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [isModelInitializing, setIsModelInitializing] = useState(false)
  const [progress, setProgress] = useState<SegmentationProgress>({ progress: 0, status: '' })
  const [showProgress, setShowProgress] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [processingConfig, setProcessingConfig] = useState<BackgroundRemovalUserConfig>(DEFAULT_BACKGROUND_REMOVAL_CONFIG)
  const [loadedModelCacheKey, setLoadedModelCacheKey] = useState<string | null>(null)

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])
  const needsModelReload = useMemo(() => loadedModelCacheKey !== null && getModelCacheKey(processingConfig) !== loadedModelCacheKey, [loadedModelCacheKey, processingConfig])
  const processButtonLabel = useMemo(() => getProcessingModeLabel(processingConfig.mode), [processingConfig.mode])

  const pendingCount = useMemo(() => countByStatus(items, 'pending'), [items])
  const errorCount = useMemo(() => countByStatus(items, 'error'), [items])
  const doneCount = useMemo(() => countByStatus(items, 'done'), [items])
  const processableCount = pendingCount + errorCount

  /** Initialize model with current config */
  const reloadModel = useCallback(async (config: BackgroundRemovalUserConfig) => {
    setIsModelInitializing(true)
    let hasStartedDownload = false

    const ready = await initializeModel(config, (modelProgress) => {
      setProgress(modelProgress)
      if (modelProgress.downloadedBytes !== undefined && modelProgress.downloadedBytes > 0) {
        if (!hasStartedDownload) {
          hasStartedDownload = true
          setShowProgress(true)
          setIsDownloading(true)
        }
      }
      if (modelProgress.progress === 100) {
        setIsDownloading(false)
      }
    })

    setIsModelInitializing(false)
    if (ready) {
      setLoadedModelCacheKey(getModelCacheKey(config))
      if (!hasStartedDownload) {
        setIsDownloading(false)
        setShowProgress(false)
      }
    }
    return ready
  }, [])

  /** Check auto-segmentation support, resolve defaults, and initialize model */
  useEffect(() => {
    let mounted = true

    const init = async () => {
      const defaultConfig = await createDefaultProcessingConfig()
      if (!mounted) return

      setProcessingConfig(defaultConfig)

      const supported = await checkAutoSegmentSupport()
      if (!mounted) return

      setAutoSegmentSupported(supported)

      if (supported) {
        await reloadModel(defaultConfig)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [reloadModel])

  /** Reset settings to defaults with runtime GPU detection */
  const handleResetConfig = useCallback(async () => {
    const defaultConfig = await createDefaultProcessingConfig()
    setProcessingConfig(defaultConfig)
  }, [])

  /** Hide progress bar when download is complete */
  useEffect(() => {
    if (progress.progress === 100 && !progress.isInitializing) {
      setShowProgress(false)
    }
  }, [progress.progress, progress.isInitializing])

  /** Add files to the batch queue */
  const addFiles = useCallback(async (files: FileList | File[]) => {
    try {
      const newItems = await createImageItemsFromFiles(files)
      if (newItems.length === 0) return

      setItems((prev) => [...prev, ...newItems])
      setSelectedId((prev) => prev ?? newItems[0].id)
      setViewMode('grid')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Image loading failed:', error)
    }
  }, [])

  /** Handle file upload */
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      await addFiles(files)
      e.target.value = ''
    },
    [addFiles]
  )

  /** Handle drag and drop upload */
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        await addFiles(files)
      }
    },
    [addFiles]
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

  /** Batch AI processing */
  const handleBatchProcess = useCallback(async () => {
    if (!autoSegmentSupported || items.length === 0) return

    const toProcess = items.filter((item) => item.status === 'pending' || item.status === 'error')
    if (toProcess.length === 0) return

    if (needsModelReload) {
      const ready = await reloadModel(processingConfig)
      if (!ready) return
    }

    setIsBatchProcessing(true)
    setBatchProgress({ current: 0, total: toProcess.length })

    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i]
      const itemId = item.id

      setItems((prev) => updateImageItem(prev, itemId, { status: 'processing', errorMessage: undefined }))
      setBatchProgress({ current: i + 1, total: toProcess.length })

      const result = await processImageItem(item, processingConfig)

      setItems((prev) =>
        updateImageItem(prev, itemId, {
          processedImageData: result.processedImageData,
          status: result.status,
          errorMessage: result.errorMessage,
        })
      )
    }

    setIsBatchProcessing(false)
    setBatchProgress({ current: 0, total: 0 })
  }, [autoSegmentSupported, items, needsModelReload, processingConfig, reloadModel])

  /** Manually reload model after config change */
  const handleReloadModel = useCallback(async () => {
    await reloadModel(processingConfig)
  }, [processingConfig, reloadModel])

  /** Remove a single item from the queue */
  const handleRemoveItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id)
        if (selectedId === id) {
          setSelectedId(next.length > 0 ? next[0].id : null)
          setViewMode('grid')
        }
        return next
      })
    },
    [selectedId]
  )

  /** Clear all items */
  const handleClearAll = useCallback(() => {
    setItems([])
    setSelectedId(null)
    setViewMode('grid')
  }, [])

  /** Download selected item */
  const handleDownloadSelected = useCallback(async () => {
    if (!selectedItem) return
    await downloadImageItem(selectedItem, processingConfig)
  }, [selectedItem, processingConfig])

  /** Download all processed items */
  const handleDownloadAll = useCallback(async () => {
    const downloadable = items.filter((item) => item.processedImageData || item.image)
    if (downloadable.length === 0) return

    setIsDownloadingAll(true)
    try {
      await downloadAllImageItems(downloadable, processingConfig)
    } finally {
      setIsDownloadingAll(false)
    }
  }, [items, processingConfig])

  /** Select item and switch to detail view */
  const handleSelectItem = useCallback((id: string) => {
    setSelectedId(id)
    setViewMode('detail')
  }, [])

  const isUploadDisabled = isDownloading || isModelInitializing || isBatchProcessing

  return (
    <div className="bg-gray-100" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="flex h-full">
        {/* Left: Control panel */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Select Images button */}
            <div>
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={isUploadDisabled} className="hidden" id="file-upload" />
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-300 cursor-pointer border border-gray-300 ${
                  isUploadDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FiImage className="mr-2 h-5 w-5" aria-hidden />
                Select Images
              </label>
              <p className="text-xs text-gray-500 mt-1 text-center">Supports multiple files</p>
            </div>

            {/* AI settings */}
            {autoSegmentSupported && (
              <ProcessingSettings
                config={processingConfig}
                onChange={setProcessingConfig}
                onReset={handleResetConfig}
                disabled={isUploadDisabled}
                needsModelReload={needsModelReload}
                onReloadModel={handleReloadModel}
                isReloading={isModelInitializing}
              />
            )}

            {/* Batch AI processing */}
            {autoSegmentSupported && (
              <button
                onClick={handleBatchProcess}
                disabled={isBatchProcessing || isUploadDisabled || items.length === 0 || processableCount === 0}
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isBatchProcessing ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="-ml-1 mr-2 h-5 w-5" />
                    Processing {batchProgress.current}/{batchProgress.total}...
                  </span>
                ) : isModelInitializing ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="-ml-1 mr-2 h-5 w-5" />
                    <span className="mr-2 font-bold">AI</span>
                    Initializing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 font-bold">AI</span>
                    {processButtonLabel} {processableCount > 0 ? `(${processableCount})` : ''}
                  </span>
                )}
              </button>
            )}

            {/* View mode toggle */}
            {items.length > 0 && (
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => selectedId && setViewMode('detail')}
                  disabled={!selectedId}
                  className={`flex-1 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    viewMode === 'detail' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Detail
                </button>
              </div>
            )}

            {/* Preview toggle: original vs processed */}
            {items.length > 0 && doneCount > 0 && (
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowProcessed(false)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${!showProcessed ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setShowProcessed(true)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${showProcessed ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Processed
                </button>
              </div>
            )}

            {/* Download buttons */}
            {items.length > 0 && (
              <div className="space-y-2">
                {selectedItem && viewMode === 'detail' && (
                  <button
                    onClick={handleDownloadSelected}
                    disabled={isUploadDisabled || isDownloadingAll}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <span className="flex items-center justify-center">
                      <FiDownload className="mr-2 h-5 w-5" aria-hidden />
                      {selectedItem.processedImageData ? 'Download PNG' : 'Download Image'}
                    </span>
                  </button>
                )}
                <button
                  onClick={handleDownloadAll}
                  disabled={isUploadDisabled || isDownloadingAll || items.length === 0}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <span className="flex items-center justify-center">
                    {isDownloadingAll ? (
                      <>
                        <Spinner className="-ml-1 mr-2 h-5 w-5" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FiDownload className="mr-2 h-5 w-5" aria-hidden />
                        Download All ({items.length})
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* Clear all */}
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isBatchProcessing}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-300 border border-gray-300 disabled:opacity-50"
              >
                Clear All
              </button>
            )}

            {/* Image list */}
            {items.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  {items.length} image{items.length > 1 ? 's' : ''} · {doneCount} processed
                </p>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <li key={item.id}>
                      <div
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer ${
                          selectedId === item.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <button type="button" onClick={() => handleSelectItem(item.id)} className="truncate flex-1 mr-2 text-left">
                          {item.file.name}
                        </button>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 shrink-0" aria-label="Remove">
                          <FiX className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!autoSegmentSupported && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">AI feature is not available, please check browser support</div>
            )}
          </div>
        </div>

        {/* Right: Preview area */}
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden relative">
          {/* Model initialization overlay */}
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

          {/* Batch processing overlay */}
          {isBatchProcessing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
              <Spinner className="h-4 w-4" color="text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                Processing {batchProgress.current}/{batchProgress.total}
              </span>
            </div>
          )}

          {items.length === 0 ? (
            <div
              onDrop={isUploadDisabled ? undefined : handleDrop}
              onDragOver={isUploadDisabled ? undefined : handleDragOver}
              onDragEnter={isUploadDisabled ? undefined : handleDragEnter}
              onDragLeave={isUploadDisabled ? undefined : handleDragLeave}
              className="flex-1 flex items-center justify-center p-6"
            >
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={isUploadDisabled} className="hidden" id="file-upload-preview" />
              <label
                htmlFor="file-upload-preview"
                className={`flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-2xl transition-all duration-300 w-full max-w-md ${
                  isUploadDisabled
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                    : isDragging
                      ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-lg cursor-pointer'
                      : 'border-gray-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex items-center mb-2">
                  <FiImage className={`mr-2 h-5 w-5 transition-colors duration-300 ${isDragging ? 'text-indigo-600' : 'text-gray-700'}`} aria-hidden />
                  <span className={`font-semibold text-xl transition-colors duration-300 ${isDragging ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {isDragging ? 'Drop to upload' : 'Select Images'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 text-center">
                  {isDragging ? 'Or click here to select files' : 'Supports JPG, PNG, WEBP — multiple files or drag and drop'}
                </span>
              </label>
            </div>
          ) : viewMode === 'grid' ? (
            <BatchPreviewGrid items={items} selectedId={selectedId} showProcessed={showProcessed} onSelect={handleSelectItem} />
          ) : selectedItem ? (
            <PreviewPane
              imageData={showProcessed && selectedItem.processedImageData ? selectedItem.processedImageData : undefined}
              image={showProcessed && selectedItem.processedImageData ? undefined : selectedItem.image}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
