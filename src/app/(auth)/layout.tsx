'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuthHydrated, useAuthStore } from '../../stores/auth-store'

// (auth) 폴더 안의 화면은 모두 이 레이아웃을 거쳐요. 로그인하지 않았으면 /login으로 보내요.
// 토큰이 localStorage에만 있어서 서버가 아니라 브라우저에서 확인해요.
export default function AuthLayout({ children }: { children: ReactNode }) {
  const hydrated = useAuthHydrated()
  const isLoggedIn = useAuthStore((state) => !!state.accessToken)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (hydrated && !isLoggedIn) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
  }, [hydrated, isLoggedIn, pathname, router])

  return hydrated && isLoggedIn ? children : null
}
