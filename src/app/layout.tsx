import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Header } from '../components/header'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'UMCine',
  icons: '/favicon.svg',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col bg-[#f9fbff] font-sans text-[#1b1d22]">
            <Header />
            {children}
            <footer className="border-t border-[#e7ebf1] bg-white">
              <div className="mx-auto flex min-h-11 max-w-[1060px] items-center justify-end gap-[5px] px-5 py-[10px] min-[651px]:px-[58px]">
                <img className="h-3 w-[18px] object-contain" src="/images/logos/tmdb-logo.svg" alt="TMDB" />
                <small className="text-[9px] text-[#8a929f]">This product uses the TMDB API but is not endorsed or certified by TMDB.</small>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
