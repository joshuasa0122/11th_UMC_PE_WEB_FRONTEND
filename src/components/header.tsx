import { Link, useLocation } from 'react-router'
import { cn } from '../lib/cn'

export function Header() {
  const { pathname } = useLocation()
  const movieActive = pathname === '/' || pathname.startsWith('/movies/')
  const searchActive = pathname === '/search'
  const menuClass = 'text-[13px] hover:text-[#22262d]'

  return (
    <header className="border-b border-[#edf0f5] bg-white">
      <div className="mx-auto flex h-[62px] max-w-[1060px] items-center gap-[18px] px-5 min-[651px]:h-[68px] min-[651px]:gap-[34px] min-[651px]:px-[58px]">
        <Link className="inline-flex shrink-0 items-center gap-[7px] text-[17px] font-extrabold tracking-[-.05em] text-[#20242b]" to="/" aria-label="UMCine 홈">
          <img className="h-[25px] w-[25px]" src="/icons/movie.svg" alt="" />
          <span>UMCine</span>
        </Link>
        <nav aria-label="주 메뉴">
          <ul className="flex items-center gap-3 min-[651px]:gap-6">
            <li><Link to="/" aria-current={movieActive ? 'page' : undefined} className={cn(menuClass, movieActive ? 'font-extrabold text-[#22262d]' : 'font-semibold text-[#59606a]')}>영화</Link></li>
            <li><Link to="/search" aria-current={searchActive ? 'page' : undefined} className={cn(menuClass, searchActive ? 'font-extrabold text-[#22262d]' : 'font-semibold text-[#59606a]')}>검색</Link></li>
            <li className={cn(menuClass, 'font-semibold text-[#59606a]')}>내 정보</li>
          </ul>
        </nav>
        <div className="ml-auto hidden items-center gap-[10px] min-[651px]:flex">
          <Link to="/search" aria-label="영화 검색" className="grid h-[31px] w-[31px] place-items-center rounded-[5px] border border-[#e9edf2]"><img className="h-[17px] w-[17px]" src="/icons/search.svg" alt="" /></Link>
          <span className="rounded-[5px] bg-[#2f73dc] px-[13px] py-[9px] text-xs font-bold text-white">로그인</span>
        </div>
      </div>
    </header>
  )
}
