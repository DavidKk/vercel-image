'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { setEditorValue } from '../utils'

export interface UseDropOptions {
  /** Whether to automatically bind events, default is true */
  autoBindEvents?: boolean
  /** Whether to disable drag and drop, default is false */
  disabled?: boolean
}

export default function useDrop(options?: UseDropOptions) {
  const { autoBindEvents = true, disabled = false } = options || {}
  const [editor, setEditor] = useState<EditorView>()

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!editor) {
        return
      }

      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length === 0) {
        return
      }

      const file = files[0]
      // 10MB size limit
      if (file.size > 10 * 1024 * 1024) {
        return
      }

      try {
        // Check if file is text
        const isText = file.type.startsWith('text/') || ['application/json', 'application/xml', 'application/javascript'].includes(file.type)
        if (!isText) {
          return
        }

        const content = await file.text()
        setEditorValue(editor, content)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to read file:', err)
      }
    },
    [editor]
  )

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (!editor || !autoBindEvents || disabled) {
      return
    }

    const container = editor.dom?.parentElement || editor.dom
    container.addEventListener('drop', handleDrop)
    container.addEventListener('dragover', handleDragOver)

    return () => {
      container.removeEventListener('drop', handleDrop)
      container.removeEventListener('dragover', handleDragOver)
    }
  }, [editor, handleDrop, handleDragOver])

  return { setEditor, handleDrop, handleDragOver }
}
