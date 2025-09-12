import { redirect } from 'next/navigation'
import Mosaic from '@/app/mosaic/components/Mosaic'
import { fetchSchema } from '@/app/mosaic/schema'
import { generate } from '@/components/Meta'

/**
 * 动态路由页面，用于编辑特定ID的图像布局
 * 通过 /mosaic/[id] 路径访问，其中 [id] 是布局ID
 * 如果请求的布局ID不存在，则重定向到布局选择页面
 */
export const { generateMetadata } = generate({
  title: 'Image Merger Tool',
  description: 'Edit your image layout',
})

export interface LayoutEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LayoutEditPage({ params }: LayoutEditPageProps) {
  const { id } = await params
  const schema = await fetchSchema(id)
  if (!schema) {
    redirect('/mosaic')
  }

  return (
    <div className="flex flex-col items-center p-10 pt-20 max-w-4xl mx-auto text-center">
      <div className="space-y-6 w-full">
        <h1 className="text-2xl font-bold">Image Merger Tool - {id}</h1>
        <p className="text-gray-600">Edit your image layout</p>
        <Mosaic schema={schema} />
      </div>
    </div>
  )
}
