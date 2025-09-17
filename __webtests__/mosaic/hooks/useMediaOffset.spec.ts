/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useMediaOffset } from '@/app/mosaic/hooks/media/useMediaOffset'

describe('useMediaOffset', () => {
  const mockSchema = {
    canvasWidth: 600,
    canvasHeight: 600,
    elements: [
      { x: 0, y: 0, width: 200, height: 200 },
      { x: 200, y: 0, width: 200, height: 200 },
      { x: 400, y: 0, width: 200, height: 200 },
    ],
  }

  it('should initialize with empty offsets', () => {
    const { result } = renderHook(() => useMediaOffset({ schema: mockSchema }))

    // Initially, all offsets should be { x: 0, y: 0 }
    expect(result.current.getMediaOffset(0)).toEqual({ x: 0, y: 0 })
    expect(result.current.getMediaOffset(1)).toEqual({ x: 0, y: 0 })
    expect(result.current.getMediaOffset(2)).toEqual({ x: 0, y: 0 })
  })

  it('should set and get media offsets correctly', () => {
    const { result } = renderHook(() => useMediaOffset({ schema: mockSchema }))

    // Set offsets
    act(() => {
      result.current.setMediaOffset(0, 10, 20)
      result.current.setMediaOffset(1, -5, 15)
      result.current.setMediaOffset(2, 0, -10)
    })

    // Check offsets
    expect(result.current.getMediaOffset(0)).toEqual({ x: 10, y: 20 })
    expect(result.current.getMediaOffset(1)).toEqual({ x: -5, y: 15 })
    expect(result.current.getMediaOffset(2)).toEqual({ x: 0, y: -10 })
  })

  it('should reset specific media offset', () => {
    const { result } = renderHook(() => useMediaOffset({ schema: mockSchema }))

    // Set an offset
    act(() => {
      result.current.setMediaOffset(0, 10, 20)
    })

    // Verify it's set
    expect(result.current.getMediaOffset(0)).toEqual({ x: 10, y: 20 })

    // Reset the offset
    act(() => {
      result.current.resetMediaOffset(0)
    })

    // Verify it's reset
    expect(result.current.getMediaOffset(0)).toEqual({ x: 0, y: 0 })
  })

  it('should reset all media offsets', () => {
    const { result } = renderHook(() => useMediaOffset({ schema: mockSchema }))

    // Set multiple offsets
    act(() => {
      result.current.setMediaOffset(0, 10, 20)
      result.current.setMediaOffset(1, -5, 15)
      result.current.setMediaOffset(2, 0, -10)
    })

    // Verify they're set
    expect(result.current.getMediaOffset(0)).toEqual({ x: 10, y: 20 })
    expect(result.current.getMediaOffset(1)).toEqual({ x: -5, y: 15 })
    expect(result.current.getMediaOffset(2)).toEqual({ x: 0, y: -10 })

    // Reset all offsets
    act(() => {
      result.current.resetAllMediaOffsets()
    })

    // Verify they're all reset
    expect(result.current.getMediaOffset(0)).toEqual({ x: 0, y: 0 })
    expect(result.current.getMediaOffset(1)).toEqual({ x: 0, y: 0 })
    expect(result.current.getMediaOffset(2)).toEqual({ x: 0, y: 0 })
  })

  it('should return default offset for non-existent media', () => {
    const { result } = renderHook(() => useMediaOffset({ schema: mockSchema }))

    // Should return default offset for non-existent media
    expect(result.current.getMediaOffset(0)).toEqual({ x: 0, y: 0 })
    expect(result.current.getMediaOffset(999)).toEqual({ x: 0, y: 0 })
  })

  it('should call onUpdate when offset changes', () => {
    const onUpdate = jest.fn()
    const { result } = renderHook(() => useMediaOffset({ 
      schema: mockSchema,
      onUpdate,
      onUpdateDeps: []
    }))

    // Set an offset
    act(() => {
      result.current.setMediaOffset(0, 10, 20)
    })

    // Verify onUpdate was called
    expect(onUpdate).toHaveBeenCalledWith(0, { 0: { x: 10, y: 20 } })

    // Reset the offset
    act(() => {
      result.current.resetMediaOffset(0)
    })

    // Verify onUpdate was called again
    expect(onUpdate).toHaveBeenCalledWith(0, { 0: { x: 0, y: 0 } })

    // Reset all offsets
    act(() => {
      result.current.resetAllMediaOffsets()
    })

    // Verify onUpdate was called with null index
    expect(onUpdate).toHaveBeenCalledWith(null, {})
  })
})