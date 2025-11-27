'use client'

import { useRequest } from 'ahooks'
import Link from 'next/link'

import { fetchSchemas } from '@/app/mosaic/schema'
import { Spinner } from '@/components/Spinner'

import { Thumbnail } from './Thumbnail'

export function LayoutGridSelect() {
  const { data: schemas, loading } = useRequest(fetchSchemas)

  if (loading) {
    return (
      <div className="w-full text-center py-4">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {schemas &&
          Object.entries(schemas).map(([id, schema]) => (
            <Link href={`/mosaic/${id}`} className="block border-2 border-gray-200 hover:border-gray-300 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md" key={id}>
              <Thumbnail schema={schema} />
            </Link>
          ))}
      </div>
    </div>
  )
}
