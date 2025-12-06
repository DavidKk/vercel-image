'use client'

interface ProgressBarProps {
  progress: number // 0-100
  status: string
  isVisible: boolean
  downloadedBytes?: number
  totalBytes?: number
  isInitializing?: boolean // Whether model is initializing after download
  className?: string
}

import { formatBytes } from '../core/utils'

export function ProgressBar(props: ProgressBarProps) {
  const { progress, status, isVisible, downloadedBytes, totalBytes, isInitializing, className } = props

  if (!isVisible) return null

  const hasDownloadInfo = downloadedBytes !== undefined && totalBytes !== undefined && totalBytes > 0

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className || ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{status}</span>
        {hasDownloadInfo && (
          <span className="text-xs text-gray-500">
            {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
      {hasDownloadInfo ? (
        progress === 100 && isInitializing ? (
          <div className="mt-2 text-xs text-gray-500 animate-pulse">Initializing model, please wait...</div>
        ) : progress < 100 ? (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="animate-pulse">Downloading, please wait...</span>
            <span>{((downloadedBytes! / totalBytes!) * 100).toFixed(1)}%</span>
          </div>
        ) : null
      ) : progress < 100 ? (
        <div className="mt-2 text-xs text-gray-500 animate-pulse">Processing, please wait...</div>
      ) : null}
    </div>
  )
}
