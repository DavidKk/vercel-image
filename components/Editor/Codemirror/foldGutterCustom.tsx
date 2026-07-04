'use client'

import { foldGutter } from '@codemirror/language'
import { GutterMarker } from '@codemirror/view'
import { renderToStaticMarkup } from 'react-dom/server'
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md'

class CustomFoldMarker extends GutterMarker {
  constructor(readonly expanded: boolean) {
    super()
  }

  public toDOM() {
    const span = document.createElement('span')
    span.className = 'customize-marker'
    span.innerHTML = renderToStaticMarkup(this.expanded ? <MdKeyboardArrowDown size={10} /> : <MdKeyboardArrowRight size={10} />)

    return span
  }
}

export const foldGutterCustom = foldGutter({
  markerDOM(open) {
    return new CustomFoldMarker(!open).toDOM()
  },
})
