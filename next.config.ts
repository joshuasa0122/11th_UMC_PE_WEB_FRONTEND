import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 상위 폴더(week0)에도 lockfile이 있어서 프로젝트 루트를 직접 알려 줘요.
  turbopack: { root: __dirname },
}

export default nextConfig
