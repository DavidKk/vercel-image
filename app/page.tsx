import Meta, { generate } from '@/components/Meta'
import Link from 'next/link'

const { generateMetadata, metaProps } = generate({
  title: 'Image Processing Tools',
  description: 'A collection of online image processing tools including image merger with multiple layout options',
})

export { generateMetadata }

export default function Home() {
  return (
    <div className="flex flex-col items-center p-10 pt-20 max-w-4xl mx-auto text-center">
      <Meta {...metaProps} />

      <div className="mt-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">Image Merger</h2>
            <p className="text-gray-600 mb-4">Combine multiple images into various layouts including grid, vertical stack, horizontal stack, and slanted stack layouts</p>
            <Link href="/mosaic" className="text-blue-500 hover:text-blue-700 font-medium">
              Try Image Merger →
            </Link>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">More Tools Coming Soon</h2>
            <p className="text-gray-600">We're constantly adding new image processing capabilities. Check back regularly for updates!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
