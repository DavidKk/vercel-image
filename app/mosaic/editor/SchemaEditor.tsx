'use client'

import { useState } from 'react'

import { Thumbnail } from '@/app/mosaic/components/Thumbnail'
import type { LayoutSchema } from '@/app/mosaic/types'
import ReactEditor from '@/components/Editor/ReactEditor'

export interface SchemaEidtorProps {
  defaultSchema: LayoutSchema
}

export default function SchemaEditor(props: SchemaEidtorProps) {
  const { defaultSchema } = props
  const [code, setCode] = useState<string>(JSON.stringify(defaultSchema, null, 2))
  const [schema, setSchema] = useState<LayoutSchema | null>(defaultSchema)

  const handleCodeChange = (value: string) => {
    setCode(value)

    try {
      const schema = JSON.parse(value)
      setSchema(schema)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/2">
        <div className="border rounded-lg overflow-hidden">
          <div className="h-[500px]">
            <ReactEditor value={code} onChange={handleCodeChange} />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div className="w-[360px] aspect-square">{schema && <Thumbnail schema={schema} />}</div>
      </div>
    </div>
  )
}
