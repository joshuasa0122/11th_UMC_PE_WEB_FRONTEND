import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Header } from '../components/header'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: () => <main className="mx-auto w-full max-w-[1060px] flex-1 px-5 py-10 min-[651px]:px-[58px]">페이지를 찾을 수 없어요.</main>,
})

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f9fbff] font-sans text-[#1b1d22]">
      <Header />
      <Outlet />
      <footer className="border-t border-[#e7ebf1] bg-white">
        <div className="mx-auto flex min-h-11 max-w-[1060px] items-center justify-end gap-[5px] px-5 py-[10px] min-[651px]:px-[58px]">
          <img className="h-3 w-[18px] object-contain" src="/images/logos/tmdb-logo.svg" alt="TMDB" />
          <small className="text-[9px] text-[#8a929f]">This product uses the TMDB API but is not endorsed or certified by TMDB.</small>
        </div>
      </footer>
      <ReactQueryDevtools />
    </div>
  )
}
