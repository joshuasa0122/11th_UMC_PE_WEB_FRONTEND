import { Route, Routes } from 'react-router'
import { Header } from './components/header'
import { MovieDetailPage } from './pages/movie-detail-page'
import { LoginPage } from './pages/login-page'
import { MovieListPage } from './pages/movie-list-page'
import { MyInfoEditPage } from './pages/my/my-info-edit-page'
import { MyInfoPage } from './pages/my/my-info-page'
import { SearchPage } from './pages/search-page'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f9fbff] font-sans text-[#1b1d22]">
      <Header />
      <Routes>
        <Route path="/" element={<MovieListPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movies/:movieId" element={<MovieDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* 로그인이 필요한 화면은 /me 아래에 모아요. 접근 제한은 이후 이 Route에 layout을 붙여 처리해요. */}
        <Route path="/me">
          <Route index element={<MyInfoPage />} />
          <Route path="edit" element={<MyInfoEditPage />} />
        </Route>
        <Route path="*" element={<main className="mx-auto w-full max-w-[1060px] flex-1 px-5 py-10 min-[651px]:px-[58px]">페이지를 찾을 수 없어요.</main>} />
      </Routes>
      <footer className="border-t border-[#e7ebf1] bg-white">
        <div className="mx-auto flex min-h-11 max-w-[1060px] items-center justify-end gap-[5px] px-5 py-[10px] min-[651px]:px-[58px]">
          <img className="h-3 w-[18px] object-contain" src="/images/logos/tmdb-logo.svg" alt="TMDB" />
          <small className="text-[9px] text-[#8a929f]">This product uses the TMDB API but is not endorsed or certified by TMDB.</small>
        </div>
      </footer>
    </div>
  )
}
