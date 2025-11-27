'use client'

import React, { useId, useMemo } from 'react'

import Codemirror, { type CodemirrorProps } from './Codemirror'

export interface ReactEditorProps extends CodemirrorProps {
  className?: string
  title?: React.ReactNode
}

export default function ReactEditor(props: ReactEditorProps) {
  const { className = '', title, value, onChange, onBlur, storageKey, disabled, hiddenLines, format } = props

  const rawUid = useId()
  const uid = useMemo(() => `${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`, [rawUid])

  const handleChange = (value: string) => {
    if (typeof onChange !== 'function') {
      return
    }

    onChange(value)
  }

  return (
    <div className={`${className} h-full flex flex-col gap-1`}>
      {title ? <h2 className="text-xs bg-indigo-100 py-1 px-2 rounded-md font-bold">{title}</h2> : null}

      <div className={`flex editor-container group ${uid} flex-1 w-full h-full relative overflow-y-auto`}>
        <Codemirror value={value} onChange={handleChange} onBlur={onBlur} storageKey={storageKey} disabled={disabled} hiddenLines={hiddenLines} format={format} />
      </div>
    </div>
  )
}
