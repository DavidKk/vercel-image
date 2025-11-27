import { generate } from '@/components/Meta'

import { fetchSchema } from '../schema'
import SchemaEditor from './SchemaEditor'

const { generateMetadata, metaProps } = generate({
  title: 'Schema Editor - Image Merger Tool',
  description: 'Online Schema Editor for Image Merger Tool',
})

export { generateMetadata }

export default async function SchemaEditorPage() {
  const schema = (await fetchSchema('grid'))!

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{metaProps.title}</h1>
          <p className="text-gray-600">{metaProps.description}</p>
        </div>

        <div className="mb-6">
          <SchemaEditor defaultSchema={schema} />
        </div>
      </div>
    </div>
  )
}
