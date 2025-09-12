import type { EditorView } from 'codemirror'

export function getEditorValue(editor: EditorView) {
  return editor.state.doc.toString()
}

export function setEditorValue(editor: EditorView, value: string) {
  const { state } = editor
  const doc = state.doc
  const currentValue = doc.toString()

  if (currentValue === value) {
    return
  }

  editor.dispatch({
    changes: {
      from: 0,
      to: doc.length,
      insert: value,
    },
  })
}
