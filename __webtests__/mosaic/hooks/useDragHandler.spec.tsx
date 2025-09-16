// eslint-disable-next-line eslint-plugin-import/no-extraneous-dependencies
import { renderHook, act } from '@testing-library/react'
import { useDragHandler } from '@/app/mosaic/hooks/useDragHandler'
import type { LayoutSchema } from '@/app/mosaic/types'

describe('useDragHandler', () => {
  const mockSchema: LayoutSchema = {
    canvasWidth: 400,
    canvasHeight: 300,
    elements: [
      { x: 0, y: 0, width: 200, height: 150 },
      { x: 200, y: 0, width: 200, height: 150 },
    ],
  }

  it('should handle drag start correctly', () => {
    const onDragStart = jest.fn()
    const { result } = renderHook(() =>
      useDragHandler({
        schema: mockSchema,
        onDragStart,
      })
    )

    const mockEvent = {
      clientX: 100,
      clientY: 75,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    act(() => {
      result.current.handleMouseDown(mockEvent)
    })

    expect(onDragStart).toHaveBeenCalledWith(0, 0, 0)
  })

  it('should handle drag move correctly', () => {
    const onDragMove = jest.fn()
    const { result } = renderHook(() =>
      useDragHandler({
        schema: mockSchema,
        onDragMove,
      })
    )

    const mockMouseDownEvent = {
      clientX: 100,
      clientY: 75,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    const mockMouseMoveEvent = {
      clientX: 150,
      clientY: 100,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    // First start dragging
    act(() => {
      result.current.handleMouseDown(mockMouseDownEvent)
    })

    // Then move (more than minimum distance)
    act(() => {
      result.current.handleMouseMove({
        ...mockMouseMoveEvent,
        clientX: 110, // 10 pixels away from start (more than 5px minimum)
        clientY: 80,
      } as unknown as React.MouseEvent<HTMLCanvasElement>)
    })

    // Expect drag move to be called with correct offset
    expect(onDragMove).toHaveBeenCalledWith(0, 10, 5)
  })

  it('should handle drag end correctly', () => {
    const onDragEnd = jest.fn()
    const { result } = renderHook(() =>
      useDragHandler({
        schema: mockSchema,
        onDragEnd,
      })
    )

    const mockMouseDownEvent = {
      clientX: 100,
      clientY: 75,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    const mockMouseUpEvent = {
      clientX: 150,
      clientY: 100,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    // First start dragging
    act(() => {
      result.current.handleMouseDown(mockMouseDownEvent)
    })

    // Then end dragging
    act(() => {
      result.current.handleMouseUp(mockMouseUpEvent)
    })

    // Expect drag end to be called with correct offset
    expect(onDragEnd).toHaveBeenCalledWith(0, 50, 25)
  })

  it('should detect when dragging has occurred', () => {
    const { result } = renderHook(() =>
      useDragHandler({
        schema: mockSchema,
      })
    )

    const mockMouseDownEvent = {
      clientX: 100,
      clientY: 75,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    const mockMouseMoveEvent = {
      clientX: 110,
      clientY: 80,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    // Initially should not have dragged
    expect(result.current.hasDragged()).toBe(false)

    // Start dragging
    act(() => {
      result.current.handleMouseDown(mockMouseDownEvent)
    })

    // Move more than minimum distance
    act(() => {
      result.current.handleMouseMove(mockMouseMoveEvent)
    })

    // Should now have dragged
    expect(result.current.hasDragged()).toBe(true)
  })

  it('should not detect dragging for small movements', () => {
    const { result } = renderHook(() =>
      useDragHandler({
        schema: mockSchema,
      })
    )

    const mockMouseDownEvent = {
      clientX: 100,
      clientY: 75,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    const mockMouseMoveEvent = {
      clientX: 102,
      clientY: 77,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 400,
          height: 300,
        }),
        width: 400,
        height: 300,
      },
    } as unknown as React.MouseEvent<HTMLCanvasElement>

    // Initially should not have dragged
    expect(result.current.hasDragged()).toBe(false)

    // Start dragging
    act(() => {
      result.current.handleMouseDown(mockMouseDownEvent)
    })

    // Move less than minimum distance
    act(() => {
      result.current.handleMouseMove(mockMouseMoveEvent)
    })

    // Should still not have dragged
    expect(result.current.hasDragged()).toBe(false)
  })
})
