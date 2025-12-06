import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  webpack: (config, { isServer }) => {
    // 支持 @imgly/background-removal 的 WASM 文件
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      }
    }
    return config
  },
}

export default nextConfig
