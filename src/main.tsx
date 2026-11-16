import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { isNotFound } from './lib/tmdb'
import { routeTree } from './routeTree.gen'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분 동안은 화면을 다시 열어도 캐시만 쓰고 요청하지 않아요.
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => !isNotFound(error) && failureCount < 2,
    },
  },
})

const router = createRouter({ routeTree, context: { queryClient }, scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
