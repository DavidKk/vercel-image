/**
 * Studio URL query helpers for shareable editor state
 */

/** Valid library asset kind filters */
export const LIBRARY_KIND_FILTERS = ['image', 'video', 'gif', 'sprite'] as const

/** Library kind filter value */
export type LibraryKindFilter = (typeof LIBRARY_KIND_FILTERS)[number]

/** Query param key for the active library kind filter */
export const LIBRARY_KIND_QUERY_KEY = 'kind'

/** Valid image origin filters when kind is image */
export const LIBRARY_IMAGE_ORIGIN_FILTERS = ['original', 'generated'] as const

/** Image origin filter for separating imports from processed outputs */
export type LibraryImageOriginFilter = (typeof LIBRARY_IMAGE_ORIGIN_FILTERS)[number]

/** Query param key for image origin filter */
export const IMAGE_ORIGIN_QUERY_KEY = 'origin'

/** Left-rail library sidebar filter ids (original/generated replace a single Images entry) */
export const LIBRARY_SIDEBAR_FILTERS = ['original', 'generated', 'video', 'gif', 'sprite'] as const

/** Library sidebar filter value */
export type LibrarySidebarFilter = (typeof LIBRARY_SIDEBAR_FILTERS)[number]

/**
 * Resolve the active sidebar filter from kind and image origin state
 * @param kind Active library kind filter
 * @param imageOrigin Active image origin filter when kind is image
 * @returns Sidebar filter id
 */
export function getLibrarySidebarFilter(kind: LibraryKindFilter, imageOrigin: LibraryImageOriginFilter): LibrarySidebarFilter {
  if (kind === 'image') return imageOrigin === 'original' ? 'original' : 'generated'
  return kind
}

/**
 * Map a sidebar filter selection to kind and image origin state
 * @param sidebar Active sidebar filter id
 * @returns Kind filter and image origin filter
 */
export function parseLibrarySidebarFilter(sidebar: string): {
  kind: LibraryKindFilter
  imageOrigin: LibraryImageOriginFilter
} {
  if (sidebar === 'original') return { kind: 'image', imageOrigin: 'original' }
  if (sidebar === 'generated') return { kind: 'image', imageOrigin: 'generated' }
  if ((LIBRARY_KIND_FILTERS as readonly string[]).includes(sidebar)) {
    return { kind: sidebar as LibraryKindFilter, imageOrigin: 'original' }
  }
  return { kind: 'image', imageOrigin: 'original' }
}

/** Query param key for selected asset ids (comma-separated) */
export const SELECTED_IDS_QUERY_KEY = 'ids'

/**
 * Parse a library kind filter from a query param value
 * @param value Raw query param value
 * @returns Valid library kind filter
 */
export function parseLibraryKindFilter(value: string | null | undefined): LibraryKindFilter {
  if (value && (LIBRARY_KIND_FILTERS as readonly string[]).includes(value)) {
    return value as LibraryKindFilter
  }
  return 'image'
}

/**
 * Parse an image origin filter from a query param value
 * @param value Raw query param value
 * @returns Valid image origin filter
 */
export function parseLibraryImageOriginFilter(value: string | null | undefined): LibraryImageOriginFilter {
  if (value && (LIBRARY_IMAGE_ORIGIN_FILTERS as readonly string[]).includes(value)) {
    return value as LibraryImageOriginFilter
  }
  return 'original'
}

/**
 * Parse selected asset ids from a comma-separated query param value
 * @param value Raw query param value
 * @returns Selected asset ids in order
 */
export function parseSelectedIds(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Compare two string arrays for equal contents and order
 * @param a First array
 * @param b Second array
 * @returns Whether arrays are equal
 */
export function areStringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

/**
 * Build a Studio query string from kind filter, image origin, and selected ids
 * @param kind Active library kind filter
 * @param selectedIds Selected asset ids
 * @param imageOrigin Active image origin filter when kind is image
 * @returns Query string without leading "?"
 */
export function buildStudioQuery(kind: LibraryKindFilter, selectedIds: string[], imageOrigin: LibraryImageOriginFilter = 'original'): string {
  const params = new URLSearchParams()
  params.set(LIBRARY_KIND_QUERY_KEY, kind)
  if (kind === 'image') {
    params.set(IMAGE_ORIGIN_QUERY_KEY, imageOrigin)
  }
  if (selectedIds.length > 0) params.set(SELECTED_IDS_QUERY_KEY, selectedIds.join(','))
  return params.toString()
}
