import { generate } from '@/components/Meta'

import { LayoutGridSelect } from './components/LayoutGridSelect'

/**
 * 图像合并工具的主页面
 * 用户在此页面选择要使用的布局类型
 * 选择后将跳转到对应的布局编辑页面
 */
export const { generateMetadata } = generate({
  title: 'Select Layout Type',
  description: 'Please select the image layout type you want to use',
})

export default function ImageMergerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Layout Type</h1>
          <p className="text-gray-600">Please select the image layout type you want to use</p>
        </div>

        <div className="mb-6">
          <LayoutGridSelect />
        </div>
      </div>
    </div>
  )
}
