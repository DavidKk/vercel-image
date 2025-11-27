import { useCallback, useEffect, useRef } from 'react'

export type RafCallback = (deltaTime: number, timestamp: number) => void

export function useRafController(autoStart = true) {
  const callbacksRef = useRef<Set<RafCallback>>(new Set())
  const runningRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(performance.now())

  const loop = useCallback((timestamp: number) => {
    if (!runningRef.current) return
    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    callbacksRef.current.forEach((cb) => cb(deltaTime, timestamp))
    frameRef.current = requestAnimationFrame(loop)
  }, [])

  const start = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true
      lastTimeRef.current = performance.now()
      frameRef.current = requestAnimationFrame(loop)
    }
  }, [loop])

  const stop = useCallback(() => {
    runningRef.current = false
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  const add = useCallback((cb: RafCallback) => {
    callbacksRef.current.add(cb)
    return () => callbacksRef.current.delete(cb)
  }, [])

  const remove = useCallback((cb: RafCallback) => {
    callbacksRef.current.delete(cb)
  }, [])

  const clear = useCallback(() => {
    callbacksRef.current.clear()
  }, [])

  useEffect(() => {
    if (autoStart) start()
    return () => stop()
  }, [autoStart, start, stop])

  return { start, stop, add, remove, clear }
}
