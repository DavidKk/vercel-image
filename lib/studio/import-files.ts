/**
 * Studio file import helpers shared by drag-drop and library import
 */

/** Allowed import scope for incoming files */
export type StudioImportScope = 'image' | 'video' | 'gif' | 'any'

/** Result of partitioning files before import */
export interface PartitionImportFilesResult {
  /** Files accepted for import */
  supported: File[]
  /** Files with unsupported MIME types */
  unsupportedType: File[]
  /** Files rejected because they do not match the active scope */
  wrongScope: File[]
}

/**
 * Partition dropped or picked files by MIME type and import scope
 * @param files Incoming files
 * @param scope Allowed import scope
 * @returns Partitioned file groups
 */
export function partitionImportFiles(files: FileList | File[], scope: StudioImportScope): PartitionImportFilesResult {
  const supported: File[] = []
  const unsupportedType: File[] = []
  const wrongScope: File[] = []

  for (const file of Array.from(files)) {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const isGif = file.type === 'image/gif'

    if (!isImage && !isVideo) {
      unsupportedType.push(file)
      continue
    }

    if (scope === 'gif') {
      if (!isGif) {
        wrongScope.push(file)
        continue
      }
      supported.push(file)
      continue
    }

    if (scope === 'image' && !isImage) {
      wrongScope.push(file)
      continue
    }

    if (scope === 'image' && isGif) {
      wrongScope.push(file)
      continue
    }

    if (scope === 'video' && !isVideo) {
      wrongScope.push(file)
      continue
    }

    supported.push(file)
  }

  return { supported, unsupportedType, wrongScope }
}

/**
 * Sort files by name using natural (numeric-aware) ordering
 * @param files Files to sort
 * @returns New array sorted ascending by filename
 */
export function sortFilesByName(files: File[]): File[] {
  return [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
}

/**
 * Build a short file name summary for notification messages
 * @param files Files to summarize
 * @param maxNames Maximum names to include inline
 * @returns Summary string
 */
export function summarizeFileNames(files: File[], maxNames = 2): string {
  if (files.length === 0) return ''
  const names = files.slice(0, maxNames).map((file) => file.name)
  const suffix = files.length > maxNames ? ` +${files.length - maxNames} more` : ''
  return `${names.join(', ')}${suffix}`
}
