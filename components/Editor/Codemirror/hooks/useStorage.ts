'use client'

import { useCallback, useMemo, useRef } from 'react'
import { keymap } from '@codemirror/view'
import type { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { getEditorValue, setEditorValue } from '../utils'

const DEFAULT_SAVE_SHORTCUTS = {
  mac: 'Cmd-s',
  win: 'Ctrl-s',
  linux: 'Ctrl-s',
}

export interface UseStorageOptions {
  /** Key for storing editor content in localStorage */
  storageKey?: string
  /** Custom save shortcut key, default is 'Mod-s' */
  saveShortcuts?: Record<'mac' | 'win' | 'linux', string>
  /** Whether to disable storage, default is false */
  disabled?: boolean
}

export default function useStorage(options: UseStorageOptions) {
  const { storageKey, saveShortcuts = DEFAULT_SAVE_SHORTCUTS, disabled = false } = options
  const editorRef = useRef<EditorView | null>(null)

  const saveToStorage = useCallback(() => {
    if (!storageKey || !editorRef.current || disabled) {
      return false
    }

    const content = getEditorValue(editorRef.current)
    localStorage.setItem(storageKey, content)

    return true
  }, [storageKey])

  const loadFromStorage = useCallback(() => {
    if (!storageKey || !editorRef.current || disabled) {
      return false
    }

    const content = localStorage.getItem(storageKey)
    if (!content) {
      return false
    }

    setEditorValue(editorRef.current, content)
    return true
  }, [storageKey])

  const extensions = useMemo<Extension[]>(() => {
    if (!storageKey) {
      return []
    }

    return [
      keymap.of([
        {
          ...saveShortcuts,
          preventDefault: true,
          run: () => {
            saveToStorage()
            return true
          },
        },
      ]),
    ]
  }, [saveToStorage])

  const setEditor = useCallback(
    (editor: EditorView) => {
      editorRef.current = editor

      requestAnimationFrame(() => {
        loadFromStorage()
      })
    },
    [loadFromStorage]
  )

  return { extensions, saveToStorage, loadFromStorage, setEditor }
}
