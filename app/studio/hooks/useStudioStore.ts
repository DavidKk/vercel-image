'use client'

/**
 * Central Studio state and action handlers.
 * Processing logic lives in lib/studio/operations; this hook orchestrates state + jobs.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type BackgroundRemovalUserConfig, createDefaultProcessingConfig, DEFAULT_BACKGROUND_REMOVAL_CONFIG, getModelCacheKey } from '@/app/progress/core/model-config'
import { checkAutoSegmentSupport, initializeModel, type SegmentationProgress } from '@/app/progress/core/segmentation-worker'
import { decodeGifBlob } from '@/lib/image/gif-decode'
import {
  buildImageAssetInput,
  buildVideoAssetInput,
  getAssetObjectUrl,
  isGeneratedImage,
  isGifAsset,
  isImportedImage,
  isStaticImageAsset,
  removeVideoSource,
  revokeAllObjectUrls,
  revokeAssetObjectUrl,
} from '@/lib/studio/asset-helpers'
import { addAssets, clearAssets, deleteAssets, listAssets } from '@/lib/studio/asset-service'
import { downloadAsset, downloadAssetsAsZip } from '@/lib/studio/export'
import type { StudioJob } from '@/lib/studio/job-types'
import {
  composeGifFromFrames,
  composeSpriteFromFrames,
  convertFormatItem,
  extractFramesFromVideo,
  processGifRemoveBackgroundBatch,
  processRemoveBackgroundBatch,
} from '@/lib/studio/operations'
import {
  buildPendingComposeGifAsset,
  buildPendingComposeSpriteAsset,
  buildPendingConvertAsset,
  buildPendingExtractFramesAsset,
  buildPendingRemoveBackgroundAsset,
  resolvePendingNavigation,
} from '@/lib/studio/pending-asset'
import type { StudioAsset } from '@/lib/studio/types'

import {
  type AssetProcessStatus,
  type ConvertFormatSettings,
  DEFAULT_CONVERT,
  DEFAULT_EXTRACTION,
  DEFAULT_GIF,
  DEFAULT_SPRITE,
  type GifComposeSettings,
  type SpriteComposeSettings,
  type StudioOperationTab,
  type StudioViewMode,
} from './studio-types'
import {
  areStringArraysEqual,
  buildStudioQuery,
  IMAGE_ORIGIN_QUERY_KEY,
  LIBRARY_KIND_QUERY_KEY,
  type LibraryImageOriginFilter,
  type LibraryKindFilter,
  parseLibraryImageOriginFilter,
  parseLibraryKindFilter,
  parseSelectedIds,
  SELECTED_IDS_QUERY_KEY,
} from './studio-url-query'

/**
 * Studio store hook managing library, selection, jobs and operations
 * @returns Flat store API for the editor
 */
export function useStudioStore() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [assets, setAssets] = useState<StudioAsset[]>([])
  /** In-memory placeholders for job outputs not yet persisted */
  const [pendingAssets, setPendingAssets] = useState<StudioAsset[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(() => parseSelectedIds(searchParams.get(SELECTED_IDS_QUERY_KEY)))
  const [viewMode, setViewMode] = useState<StudioViewMode>('detail')
  const [activeTab, setActiveTab] = useState<StudioOperationTab>('remove-background')
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<StudioJob[]>([])
  const [assetStatus, setAssetStatus] = useState<Record<string, AssetProcessStatus>>({})
  const [processingConfig, setProcessingConfig] = useState<BackgroundRemovalUserConfig>(DEFAULT_BACKGROUND_REMOVAL_CONFIG)
  const [extractionSettings, setExtractionSettings] = useState(DEFAULT_EXTRACTION)
  const [convertSettings, setConvertSettings] = useState<ConvertFormatSettings>(DEFAULT_CONVERT)
  const [gifSettings, setGifSettings] = useState<GifComposeSettings>(DEFAULT_GIF)
  const [spriteSettings, setSpriteSettings] = useState<SpriteComposeSettings>(DEFAULT_SPRITE)
  const [autoSegmentSupported, setAutoSegmentSupported] = useState(false)
  /** Whether browser capability detection for AI segmentation has finished */
  const [autoSegmentSupportChecked, setAutoSegmentSupportChecked] = useState(false)
  const [isModelInitializing, setIsModelInitializing] = useState(false)
  const [modelProgress, setModelProgress] = useState<SegmentationProgress>({ progress: 0, status: '' })
  const [showModelProgress, setShowModelProgress] = useState(false)
  const [loadedModelCacheKey, setLoadedModelCacheKey] = useState<string | null>(null)
  const [kindFilter, setKindFilterState] = useState<LibraryKindFilter>(() => parseLibraryKindFilter(searchParams.get(LIBRARY_KIND_QUERY_KEY)))
  const [imageOriginFilter, setImageOriginFilterState] = useState<LibraryImageOriginFilter>(() => parseLibraryImageOriginFilter(searchParams.get(IMAGE_ORIGIN_QUERY_KEY)))
  const [previewSpriteId, setPreviewSpriteId] = useState<string | null>(null)
  const [multiSelectMode, setMultiSelectModeState] = useState(false)

  const assetsRef = useRef(assets)
  assetsRef.current = assets

  const pendingAssetsRef = useRef(pendingAssets)
  pendingAssetsRef.current = pendingAssets

  /** Merge persisted assets with in-memory pending placeholders */
  const allAssets = useMemo(() => [...assets, ...pendingAssets], [assets, pendingAssets])

  /** Sync kind filter and selection from URL query (back/forward and direct links) */
  useEffect(() => {
    const nextKind = parseLibraryKindFilter(searchParams.get(LIBRARY_KIND_QUERY_KEY))
    const nextOrigin = parseLibraryImageOriginFilter(searchParams.get(IMAGE_ORIGIN_QUERY_KEY))
    const nextIds = parseSelectedIds(searchParams.get(SELECTED_IDS_QUERY_KEY))

    setKindFilterState((prev) => (prev === nextKind ? prev : nextKind))
    setImageOriginFilterState((prev) => (prev === nextOrigin ? prev : nextOrigin))
    setSelectedIds((prev) => (areStringArraysEqual(prev, nextIds) ? prev : nextIds))
  }, [searchParams])

  /** Persist kind filter, image origin, and selection to URL query */
  useEffect(() => {
    const nextQuery = buildStudioQuery(kindFilter, selectedIds, imageOriginFilter)
    if (nextQuery === searchParams.toString()) return
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [kindFilter, imageOriginFilter, selectedIds, pathname, router, searchParams])

  /** Drop selected ids that no longer exist after assets load or refresh */
  useEffect(() => {
    if (loading) return
    setSelectedIds((prev) => {
      const valid = prev.filter((id) => allAssets.some((asset) => asset.id === id))
      return areStringArraysEqual(prev, valid) ? prev : valid
    })
  }, [loading, allAssets])

  /** Update library kind filter */
  const setKindFilter = useCallback((value: string) => {
    setKindFilterState(parseLibraryKindFilter(value))
  }, [])

  /** Update image origin filter for the Images library */
  const setImageOriginFilter = useCallback((value: LibraryImageOriginFilter) => {
    setImageOriginFilterState(value)
  }, [])

  /** Reload asset list from IndexedDB */
  const refresh = useCallback(async () => {
    const next = await listAssets()
    setAssets(next)
    return next
  }, [])

  /** Hydrate library from IndexedDB on mount */
  useEffect(() => {
    let active = true
    listAssets()
      .then((next) => {
        if (active) setAssets(next)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  /** Load or reload the segmentation model in the worker */
  const reloadModel = useCallback(async (config: BackgroundRemovalUserConfig) => {
    setIsModelInitializing(true)
    let hasDownload = false
    const ready = await initializeModel(config, (p) => {
      setModelProgress(p)
      if (p.downloadedBytes && p.downloadedBytes > 0) {
        hasDownload = true
        setShowModelProgress(true)
      }
    })
    setIsModelInitializing(false)
    if (ready) {
      setLoadedModelCacheKey(getModelCacheKey(config))
      if (!hasDownload) setShowModelProgress(false)
    }
    return ready
  }, [])

  /** Boot: detect WebGPU support and apply default processing config (model loads on demand) */
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const defaultConfig = await createDefaultProcessingConfig()
      if (!mounted) return
      setProcessingConfig(defaultConfig)
      const supported = await checkAutoSegmentSupport()
      if (!mounted) return
      setAutoSegmentSupported(supported)
      setAutoSegmentSupportChecked(true)
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  /** Revoke blob URLs on unmount */
  useEffect(() => {
    return () => {
      revokeAllObjectUrls()
    }
  }, [])

  const needsModelReload = useMemo(() => loadedModelCacheKey !== null && getModelCacheKey(processingConfig) !== loadedModelCacheKey, [loadedModelCacheKey, processingConfig])

  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      if (asset.kind !== kindFilter) return false
      if (kindFilter !== 'image') return true
      return imageOriginFilter === 'original' ? isImportedImage(asset) : isGeneratedImage(asset)
    })
  }, [allAssets, kindFilter, imageOriginFilter])

  const selectedAssets = useMemo(() => {
    const byId = new Map(allAssets.map((a) => [a.id, a]))
    return selectedIds.map((id) => byId.get(id)).filter((asset): asset is StudioAsset => asset != null)
  }, [allAssets, selectedIds])

  const primarySelected = useMemo(() => (selectedIds.length === 1 ? (allAssets.find((a) => a.id === selectedIds[0]) ?? null) : null), [allAssets, selectedIds])

  const parentAsset = useMemo(() => {
    if (!primarySelected?.parentId) return null
    return allAssets.find((a) => a.id === primarySelected.parentId) ?? null
  }, [allAssets, primarySelected])

  const frameAssets = useMemo(() => allAssets.filter((a) => a.kind === 'image' && a.source === 'frame'), [allAssets])

  const spriteAsset = useMemo(() => {
    if (previewSpriteId) return allAssets.find((a) => a.id === previewSpriteId) ?? null
    return allAssets.find((a) => a.kind === 'sprite') ?? null
  }, [allAssets, previewSpriteId])

  const isBusy = useMemo(() => jobs.some((j) => j.status === 'running'), [jobs])
  const runningJob = useMemo(() => jobs.find((j) => j.status === 'running') ?? null, [jobs])

  /** Merge partial updates into a tracked job */
  const patchJob = useCallback((id: string, patch: Partial<StudioJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }, [])

  /** Remove in-memory pending placeholders and revoke their object URLs */
  const removePendingByIds = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    setPendingAssets((prev) => prev.filter((asset) => !ids.includes(asset.id)))
    for (const id of ids) {
      revokeAssetObjectUrl(id)
    }
    setAssetStatus((prev) => {
      const next = { ...prev }
      for (const id of ids) {
        delete next[id]
      }
      return next
    })
  }, [])

  /**
   * Register pending outputs and navigate to the result view immediately
   * @param pending Pending placeholder assets for the job
   * @param jobId Active job id
   */
  const beginPendingOutputs = useCallback(
    (pending: StudioAsset[], jobId: string) => {
      if (pending.length === 0) return

      setPendingAssets((prev) => [...prev, ...pending])
      setAssetStatus((status) => {
        const next = { ...status }
        for (const asset of pending) {
          next[asset.id] = 'processing'
        }
        return next
      })

      const navigation = resolvePendingNavigation(pending)
      setKindFilterState(navigation.kindFilter)
      if (navigation.imageOrigin) {
        setImageOriginFilterState(navigation.imageOrigin)
      }
      setViewMode(navigation.viewMode)
      setSelectedIds(pending.map((asset) => asset.id))

      if (navigation.viewMode === 'sprite') {
        setPreviewSpriteId(pending[0].id)
      }

      patchJob(jobId, { outputAssetIds: pending.map((asset) => asset.id) })
    },
    [patchJob]
  )

  /**
   * Discard pending placeholders after a job failure
   * @param jobId Failed job id
   * @param pendingIds Pending asset ids to remove
   * @param error Error message
   * @param message User-facing status message
   */
  const failPendingJob = useCallback(
    (jobId: string, pendingIds: string[], error: string, message: string) => {
      removePendingByIds(pendingIds)
      patchJob(jobId, { status: 'error', error, message })
      setSelectedIds((prev) => prev.filter((id) => !pendingIds.includes(id)))
    },
    [patchJob, removePendingByIds]
  )

  /**
   * Replace pending placeholders with persisted assets after job success
   * @param jobId Completed job id
   * @param pendingIds Pending asset ids to remove
   * @param created Persisted output assets
   * @param patch Optional job patch fields
   */
  const finalizePendingJob = useCallback(
    async (jobId: string, pendingIds: string[], created: StudioAsset[], patch: Partial<StudioJob>) => {
      removePendingByIds(pendingIds)
      patchJob(jobId, {
        status: 'done',
        progress: 100,
        outputAssetIds: created.map((asset) => asset.id),
        ...patch,
      })
      setSelectedIds(created.map((asset) => asset.id))

      const gif = created.find((asset) => asset.kind === 'gif')
      if (gif) {
        setKindFilterState('gif')
        setViewMode('detail')
      }

      const sprite = created.find((asset) => asset.kind === 'sprite')
      if (sprite) {
        setPreviewSpriteId(sprite.id)
        setKindFilterState('sprite')
        setViewMode('sprite')
      }

      if (created.some((asset) => asset.kind === 'image' && asset.source !== 'import')) {
        setKindFilterState('image')
        setImageOriginFilterState('generated')
        if (!gif && !sprite) {
          setViewMode('detail')
        }
      }
    },
    [patchJob, removePendingByIds]
  )

  /** Import images and videos into IndexedDB */
  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const inputs = []
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          inputs.push(await buildImageAssetInput(file))
        } else if (file.type.startsWith('video/')) {
          const { input } = await buildVideoAssetInput(file)
          inputs.push(input)
        }
      }
      if (inputs.length === 0) return []
      const created = await addAssets(inputs)
      await refresh()
      setSelectedIds(created.length > 0 ? [created[0].id] : [])
      setViewMode('detail')
      return created
    },
    [refresh]
  )

  const removeAssetsById = useCallback(
    async (ids: string[]) => {
      const pendingIds = ids.filter((id) => pendingAssetsRef.current.some((asset) => asset.id === id))
      const persistedIds = ids.filter((id) => !pendingIds.includes(id))

      removePendingByIds(pendingIds)

      for (const id of persistedIds) {
        revokeAssetObjectUrl(id)
        removeVideoSource(id)
      }
      if (persistedIds.length > 0) {
        await deleteAssets(persistedIds)
        await refresh()
      }

      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
    },
    [refresh, removePendingByIds]
  )

  const removeAll = useCallback(async () => {
    revokeAllObjectUrls()
    for (const a of assetsRef.current) removeVideoSource(a.id)
    setPendingAssets([])
    await clearAssets()
    setSelectedIds([])
    setJobs([])
    setAssetStatus({})
    await refresh()
  }, [refresh])

  /**
   * Toggle asset selection.
   * Uses multi-select mode unless forceMulti is true (e.g. timeline frame strip).
   * @param id Asset id to toggle
   * @param forceMulti When true, always append/toggle in the selection list
   */
  const toggleSelect = useCallback(
    (id: string, forceMulti = false) => {
      const multi = forceMulti || multiSelectMode
      setSelectedIds((prev) => {
        if (multi) return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        return prev.length === 1 && prev[0] === id ? [] : [id]
      })
    },
    [multiSelectMode]
  )

  /** Enable or disable library multi-select mode */
  const setMultiSelectMode = useCallback((enabled: boolean) => {
    setMultiSelectModeState(enabled)
    if (!enabled) {
      setSelectedIds((prev) => (prev.length <= 1 ? prev : [prev[0]]))
    }
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(filteredAssets.map((a) => a.id))
  }, [filteredAssets])

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  /**
   * Batch remove background on selected images and GIFs.
   * GIFs are decoded frame-by-frame, processed, then re-encoded.
   * Runs sequentially because the segmentation worker holds a single model instance.
   */
  const runRemoveBackground = useCallback(async () => {
    const imageTargets = selectedAssets.filter(isStaticImageAsset)
    const gifTargets = selectedAssets.filter(isGifAsset)
    if ((imageTargets.length === 0 && gifTargets.length === 0) || !autoSegmentSupported) return

    const allTargets = [...imageTargets, ...gifTargets]
    const jobId = crypto.randomUUID()
    const pendingOutputs = allTargets.map((target) => buildPendingRemoveBackgroundAsset(target, jobId, processingConfig))

    setJobs((prev) => [
      ...prev,
      {
        id: jobId,
        type: 'removeBackground',
        inputAssetIds: allTargets.map((a) => a.id),
        config: { ...processingConfig },
        status: 'running',
        progress: 0,
        message: 'Removing background...',
        outputAssetIds: [],
        createdAt: Date.now(),
      },
    ])
    beginPendingOutputs(pendingOutputs, jobId)

    if (loadedModelCacheKey === null || needsModelReload) {
      const ready = await reloadModel(processingConfig)
      if (!ready) {
        failPendingJob(
          jobId,
          pendingOutputs.map((asset) => asset.id),
          'Model failed to load',
          'Failed'
        )
        return
      }
    }

    let gifFrameTotal = 0
    const gifFrameCounts: number[] = []
    for (const gifAsset of gifTargets) {
      const decoded = await decodeGifBlob(gifAsset.blob)
      gifFrameCounts.push(decoded.frames.length)
      gifFrameTotal += decoded.frames.length
    }
    const totalSteps = imageTargets.length + gifFrameTotal
    let completedSteps = 0

    const imageResults = await processRemoveBackgroundBatch(imageTargets, processingConfig, () => {
      completedSteps += 1
      patchJob(jobId, {
        progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100,
      })
    })

    const gifResults = await processGifRemoveBackgroundBatch(gifTargets, processingConfig, (assetIndex, _assetTotal, frameCurrent) => {
      const framesBefore = gifFrameCounts.slice(0, assetIndex - 1).reduce((sum, count) => sum + count, 0)
      completedSteps = imageTargets.length + framesBefore + frameCurrent
      patchJob(jobId, {
        progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100,
      })
    })

    patchJob(jobId, {
      progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100,
    })

    const results = [...imageResults, ...gifResults]
    const outputs = []
    let errorCount = 0
    for (const result of results) {
      if (result.output) {
        outputs.push(result.output)
      } else {
        errorCount++
      }
    }

    const pendingIds = pendingOutputs.map((asset) => asset.id)

    if (outputs.length === 0) {
      failPendingJob(jobId, pendingIds, 'All items failed', 'Failed')
      return
    }

    const created = await addAssets(outputs)
    await refresh()
    await finalizePendingJob(jobId, pendingIds, created, {
      message: errorCount > 0 ? `Done with ${errorCount} error(s)` : 'Done',
    })
  }, [
    selectedAssets,
    autoSegmentSupported,
    loadedModelCacheKey,
    needsModelReload,
    reloadModel,
    processingConfig,
    patchJob,
    refresh,
    beginPendingOutputs,
    failPendingJob,
    finalizePendingJob,
  ])

  /** Convert selected images to another format */
  const runConvertFormat = useCallback(async () => {
    const targets = selectedAssets.filter((a) => a.kind === 'image')
    if (targets.length === 0) return

    const jobId = crypto.randomUUID()
    const pendingOutputs = targets.map((target) => buildPendingConvertAsset(target, jobId, convertSettings.format))

    setJobs((prev) => [
      ...prev,
      {
        id: jobId,
        type: 'convertFormat',
        inputAssetIds: targets.map((a) => a.id),
        config: { ...convertSettings },
        status: 'running',
        progress: 0,
        message: 'Converting format...',
        outputAssetIds: [],
        createdAt: Date.now(),
      },
    ])
    beginPendingOutputs(pendingOutputs, jobId)

    const outputs = []
    for (let i = 0; i < targets.length; i++) {
      patchJob(jobId, { progress: Math.round((i / targets.length) * 100) })
      outputs.push(await convertFormatItem(targets[i], convertSettings))
    }

    const pendingIds = pendingOutputs.map((asset) => asset.id)
    const created = await addAssets(outputs)
    await refresh()
    await finalizePendingJob(jobId, pendingIds, created, { message: 'Done' })
  }, [selectedAssets, convertSettings, patchJob, refresh, beginPendingOutputs, finalizePendingJob])

  /** Extract frames from the selected video asset */
  const runExtractFrames = useCallback(async () => {
    const videoAsset = selectedAssets.find((a) => a.kind === 'video')
    if (!videoAsset) return

    const jobId = crypto.randomUUID()
    const pendingOutput = buildPendingExtractFramesAsset(videoAsset, jobId)

    setJobs((prev) => [
      ...prev,
      {
        id: jobId,
        type: 'extractFrames',
        inputAssetIds: [videoAsset.id],
        config: { ...extractionSettings },
        status: 'running',
        progress: 0,
        message: 'Extracting frames...',
        outputAssetIds: [],
        createdAt: Date.now(),
      },
    ])
    beginPendingOutputs([pendingOutput], jobId)

    const outputs = await extractFramesFromVideo(videoAsset, extractionSettings, (current, total) => {
      patchJob(jobId, { progress: Math.round((current / total) * 100) })
    })

    const pendingIds = [pendingOutput.id]

    if (outputs.length === 0) {
      failPendingJob(jobId, pendingIds, 'No frames in range', 'No frames extracted')
      return
    }

    const created = await addAssets(outputs)
    await refresh()
    await finalizePendingJob(jobId, pendingIds, created, {
      message: `Extracted ${created.length} frames`,
    })
  }, [selectedAssets, extractionSettings, patchJob, refresh, beginPendingOutputs, failPendingJob, finalizePendingJob])

  /** Compose GIF from selected frame assets */
  const runComposeGif = useCallback(async () => {
    const frames = selectedAssets.filter((a) => a.source === 'frame' || a.kind === 'image')
    if (frames.length === 0) return

    const jobId = crypto.randomUUID()
    const parentVideo = frames[0]?.parentId ? assetsRef.current.find((a) => a.id === frames[0].parentId) : null
    const pendingOutput = buildPendingComposeGifAsset(frames, jobId, parentVideo?.name, gifSettings.intervalMs)

    setJobs((prev) => [
      ...prev,
      {
        id: jobId,
        type: 'composeGif',
        inputAssetIds: frames.map((a) => a.id),
        config: { ...gifSettings },
        status: 'running',
        progress: 0,
        message: 'Composing GIF...',
        outputAssetIds: [],
        createdAt: Date.now(),
      },
    ])
    beginPendingOutputs([pendingOutput], jobId)

    const output = await composeGifFromFrames(frames, gifSettings, parentVideo?.name)
    const pendingIds = [pendingOutput.id]
    const created = await addAssets([output])
    await refresh()
    await finalizePendingJob(jobId, pendingIds, created, { message: 'GIF ready' })
  }, [selectedAssets, gifSettings, patchJob, refresh, beginPendingOutputs, finalizePendingJob])

  /** Compose sprite sheet from selected frame assets */
  const runComposeSprite = useCallback(async () => {
    const frames = selectedAssets.filter((a) => a.kind === 'image')
    if (frames.length === 0) return

    const jobId = crypto.randomUUID()
    const pendingOutput = buildPendingComposeSpriteAsset(frames, jobId, spriteSettings.columns)

    setJobs((prev) => [
      ...prev,
      {
        id: jobId,
        type: 'composeSprite',
        inputAssetIds: frames.map((a) => a.id),
        config: { ...spriteSettings },
        status: 'running',
        progress: 0,
        message: 'Composing sprite sheet...',
        outputAssetIds: [],
        createdAt: Date.now(),
      },
    ])
    beginPendingOutputs([pendingOutput], jobId)

    const output = await composeSpriteFromFrames(frames, spriteSettings)
    const pendingIds = [pendingOutput.id]
    const created = await addAssets([output])
    await refresh()
    await finalizePendingJob(jobId, pendingIds, created, { message: 'Sprite ready' })
  }, [selectedAssets, spriteSettings, patchJob, refresh, beginPendingOutputs, finalizePendingJob])

  const handleResetConfig = useCallback(async () => {
    setProcessingConfig(await createDefaultProcessingConfig())
  }, [])

  const handleReloadModel = useCallback(async () => {
    await reloadModel(processingConfig)
  }, [reloadModel, processingConfig])

  const exportSelected = useCallback(() => {
    downloadAssetsAsZip(selectedAssets.length > 0 ? selectedAssets : assets, 'studio-export.zip')
  }, [selectedAssets, assets])

  const exportSingle = useCallback((asset: StudioAsset) => {
    downloadAsset(asset)
  }, [])

  return {
    assets,
    allAssets,
    filteredAssets,
    selectedIds,
    selectedAssets,
    primarySelected,
    parentAsset,
    frameAssets,
    spriteAsset,
    viewMode,
    activeTab,
    loading,
    jobs,
    runningJob,
    assetStatus,
    processingConfig,
    extractionSettings,
    convertSettings,
    gifSettings,
    spriteSettings,
    autoSegmentSupported,
    autoSegmentSupportChecked,
    isModelInitializing,
    modelProgress,
    showModelProgress,
    needsModelReload,
    kindFilter,
    imageOriginFilter,
    multiSelectMode,
    isBusy,
    getAssetObjectUrl,
    refresh,
    importFiles,
    removeAssetsById,
    removeAll,
    toggleSelect,
    selectAll,
    clearSelection,
    setMultiSelectMode,
    setViewMode,
    setActiveTab,
    setProcessingConfig,
    setExtractionSettings,
    setConvertSettings,
    setGifSettings,
    setSpriteSettings,
    setKindFilter,
    setImageOriginFilter,
    setShowModelProgress,
    runRemoveBackground,
    runConvertFormat,
    runExtractFrames,
    runComposeGif,
    runComposeSprite,
    handleResetConfig,
    handleReloadModel,
    exportSelected,
    exportSingle,
  }
}

/** Store shape shared through context */
export type StudioStore = ReturnType<typeof useStudioStore>

// Re-export types for consumers
export type { AssetProcessStatus, ConvertFormatSettings, GifComposeSettings, SpriteComposeSettings, StudioOperationTab, StudioViewMode } from './studio-types'
