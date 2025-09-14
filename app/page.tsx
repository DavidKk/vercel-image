import { Suspense } from 'react'
import Link from 'next/link'
import { MosaicShowcase } from '@/app/mosaic/components/MosaicShowcase'
import { Spinner } from '@/components/Spinner'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-124px)] bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col">
      {/* Main Content - Banner */}
      <div className="flex flex-1 justify-center items-center max-w-5xl mx-auto w-full">
        <div className="flex flex-col items-stretch lg:flex-row p-4 gap-6 w-full">
          {/* Left Content - Description and CTA */}
          <div className="lg:w-2/5 flex flex-col justify-center">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/50">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Image Processing Toolkit</h1>
              <p className="text-gray-700 mb-5">Process images online without uploading to servers. Combine multiple images to create beautiful layout designs.</p>

              {/* Features */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">Privacy First</h3>
                    <p className="text-gray-700 text-sm">All processing happens in your browser. Your images never leave your device.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">Multiple Layouts</h3>
                    <p className="text-gray-700 text-sm">Create stunning designs with various layout options for your image collections.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">High Quality Output</h3>
                    <p className="text-gray-700 text-sm">Generate high-resolution images up to 1024x1024 pixels for professional use.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">Easy to Use</h3>
                    <p className="text-gray-700 text-sm">Intuitive interface that makes creating beautiful image layouts effortless.</p>
                  </div>
                </div>
              </div>

              <Link
                href="/mosaic"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 text-center text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 inline-block w-full"
              >
                Try Mosaic Now
              </Link>
            </div>
          </div>

          {/* Right Content - Showcase */}
          <div className="lg:w-3/5 w-full flex flex-1">
            <div className="w-full rounded-xl p-3 bg-white/20 backdrop-blur-lg shadow-lg border border-white/50 flex justify-center items-center">
              <div className="aspect-square p-10 w-full rounded-lg overflow-hidden">
                <Suspense
                  fallback={
                    <div className="aspect-square w-full bg-white/20 rounded-lg flex items-center justify-center">
                      <div className="text-gray-600 text-sm">
                        <Spinner />
                      </div>
                    </div>
                  }
                >
                  <MosaicShowcase />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
