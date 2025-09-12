'use client'

import { GutterMarker } from '@codemirror/view'
import { foldGutter } from '@codemirror/language'

class CustomFoldMarker extends GutterMarker {
  constructor(readonly expanded: boolean) {
    super()
  }

  public toDOM() {
    const span = document.createElement('span')
    span.className = 'cusomize-marker'
    span.innerHTML = this.expanded
      ? '<svg width="10" height="10"><path d="M1,3 L5,7 L9,3 Z" fill="currentColor"/></svg>'
      : '<svg width="10" height="10"><path d="M3,1 L7,5 L3,9 Z" fill="currentColor"/></svg>'

    return span
  }
}

export const foldGutterCustom = foldGutter({
  markerDOM(open) {
    return new CustomFoldMarker(!open).toDOM()
  },
})
