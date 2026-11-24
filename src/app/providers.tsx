'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState, type ReactNode } from 'react'
import { isNotFound } from '../lib/tmdb'
import { useAuthStore } from '../stores/auth-store'
import { useBookmarkStore } from '../stores/bookmark-store'

export function Providers({ children }: { children: ReactNode }) {
  // 모듈 전역에 두면 서버에서 여러 사용자가 캐시를 함께 쓰게 돼요. 컴포넌트마다 한 번만 만들어요.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 5분 동안은 화면을 다시 열어도 캐시만 쓰고 요청하지 않아요.
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => !isNotFound(error) && failureCount < 2,
      },
    },
  }))

  // 브라우저에서 hydration이 끝난 뒤 localStorage의 로그인·북마크를 복원해요.
  useEffect(() => {
    useAuthStore.persist.rehydrate()
    useBookmarkStore.persist.rehydrate()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
