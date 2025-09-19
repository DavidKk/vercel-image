import type { Ref } from 'react'

export function mergeRefs<T = any>(...refs: Array<Ref<T> | undefined | null>) {
  return (instance: T | null) => {
    for (const ref of refs) {
      if (!ref) {
        continue
      }

      if (typeof ref === 'function') {
        ref(instance)
        continue
      }

      ref.current = instance
    }
  }
}
