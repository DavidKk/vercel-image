/**
 * Layout helpers for iOS-style library drag reorder previews
 */

/** Number of columns in the library asset grid */
export const LIBRARY_GRID_COLUMNS = 2

/**
 * Compute the visual display index each asset should occupy during a drag.
 *
 * The DOM keeps its natural order; this maps each natural index to the slot it should
 * visually move to after previewing a move from `sourceIndex` to `hoverIndex`.
 *
 * @param count Total number of assets in the filtered list
 * @param sourceIndex Natural index of the dragged asset
 * @param hoverIndex Target slot index (0..count - 1)
 * @returns Array where result[naturalIndex] = target display index
 */
export function computeLibraryDisplayIndices(count: number, sourceIndex: number, hoverIndex: number): number[] {
  const result = new Array<number>(count)
  const targetSlot = Math.min(Math.max(0, hoverIndex), count - 1)

  const order = Array.from({ length: count }, (_, index) => index)
  const [moved] = order.splice(sourceIndex, 1)
  order.splice(targetSlot, 0, moved)

  order.forEach((naturalIndex, displayIndex) => {
    result[naturalIndex] = displayIndex
  })

  return result
}

/**
 * Measure stable cell size from a grid slot that is not being FLIP-transformed
 * @param grid Library grid element
 * @returns Cell width and height in pixels, or null when unavailable
 */
export function measureLibraryGridCellSize(grid: HTMLElement): { width: number; height: number } | null {
  const slots = grid.querySelectorAll<HTMLElement>('[data-library-slot]')
  if (slots.length === 0) return null

  for (const slot of slots) {
    const transform = window.getComputedStyle(slot).transform
    if (transform === 'none' || !transform) {
      const rect = slot.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return { width: rect.width, height: rect.height }
      }
    }
  }

  const rect = slots[0].getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return { width: rect.width, height: rect.height }
}

/**
 * Resolve the target slot index from pointer coordinates using grid geometry.
 *
 * Card-based hit testing fails when the preview opens a gap: no card occupies that
 * cell, so the nearest-card fallback picks the wrong slot. Grid geometry maps the
 * pointer directly to a row/column cell instead.
 *
 * @param clientX Pointer X in viewport coordinates
 * @param clientY Pointer Y in viewport coordinates
 * @param grid Library grid element
 * @param assetCount Number of assets in the filtered list
 * @param fallbackIndex Index to use when the pointer is outside the grid
 * @param columns Number of grid columns
 * @returns Target slot index within the filtered list (0..assetCount - 1)
 */
export function resolveLibraryHoverIndex(
  clientX: number,
  clientY: number,
  grid: HTMLElement,
  assetCount: number,
  fallbackIndex: number,
  columns: number = LIBRARY_GRID_COLUMNS
): number {
  if (assetCount <= 0) return fallbackIndex

  const maxIndex = assetCount - 1
  const gridRect = grid.getBoundingClientRect()
  const style = window.getComputedStyle(grid)
  const paddingLeft = parseFloat(style.paddingLeft) || 0
  const paddingTop = parseFloat(style.paddingTop) || 0
  const columnGap = parseFloat(style.columnGap) || 0
  const rowGap = parseFloat(style.rowGap) || 0

  const cellSize = measureLibraryGridCellSize(grid)
  if (!cellSize) return fallbackIndex

  const strideX = cellSize.width + columnGap
  const strideY = cellSize.height + rowGap
  if (strideX <= 0 || strideY <= 0) return fallbackIndex

  const localX = clientX - gridRect.left - paddingLeft
  const localY = clientY - gridRect.top - paddingTop

  if (localX < 0 || localY < 0 || localX > grid.clientWidth - paddingLeft) {
    return fallbackIndex
  }

  const col = Math.min(columns - 1, Math.max(0, Math.floor(localX / strideX)))
  const row = Math.max(0, Math.floor(localY / strideY))
  const slotIndex = row * columns + col

  return Math.min(Math.max(0, slotIndex), maxIndex)
}

/**
 * Scroll a library container when dragging near its top or bottom edge
 * @param container Scrollable library container
 * @param clientY Pointer Y in viewport coordinates
 * @returns Nothing
 */
export function autoScrollLibraryDrag(container: HTMLElement, clientY: number): void {
  const rect = container.getBoundingClientRect()
  const edge = 56
  const step = 12

  if (clientY < rect.top + edge) {
    container.scrollTop -= step
    return
  }

  if (clientY > rect.bottom - edge) {
    container.scrollTop += step
  }
}
