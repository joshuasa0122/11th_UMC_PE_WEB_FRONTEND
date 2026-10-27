import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { StatusMessage } from '../components/status-message'
import { toMovie, useTmdb, type TmdbPage } from '../lib/tmdb'
import { useBookmarkStore } from '../stores/bookmark-store'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('query') ?? '').trim()
  return <SearchContent key={query} query={query} />
}

function SearchContent({ query }: { query: string }) {
  const navigate = useNavigate()
  const [input, setInput] = useState(query)

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = input.trim()
    navigate(nextQuery ? `/search?query=${encodeURIComponent(nextQuery)}` : '/search')
  }

  return (
    <main className="mx-auto w-full max-w-[1060px] flex-1 px-5 py-6 min-[651px]:px-[58px]">
      {query ? (
        <>
          <h1 className="mb-4 text-[27px] font-bold tracking-[-.06em]">영화 검색</h1>
          <form onSubmit={submitSearch} role="search" className="flex w-full items-center gap-3 rounded-md border border-[#dce2ea] bg-white p-2 shadow-sm">
            <img className="h-[17px] w-[17px]" src="/icons/search.svg" alt="" />
            <input className="min-w-0 flex-1 text-sm outline-none" aria-label="영화 검색어" placeholder="영화를 검색해 보세요" value={input} onChange={(event) => setInput(event.target.value)} />
            {input && <button type="button" aria-label="검색어 지우기" onClick={() => setInput('')} className="cursor-pointer text-[#6b7280]">×</button>}
            <button className="cursor-pointer rounded bg-[#202329] px-4 py-2 text-xs font-bold text-white" type="submit">다시 검색</button>
          </form>
          <SearchResults query={query} />
        </>
      ) : (
        <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center pb-24">
          <h1 className="mb-6 text-center text-[27px] font-bold tracking-[-.06em]">어떤 영화를 찾고 있나요?</h1>
          <form onSubmit={submitSearch} role="search" className="flex w-full max-w-[580px] items-center gap-3 rounded-md border border-[#dce2ea] bg-white p-2 shadow-sm">
            <img className="h-[17px] w-[17px]" src="/icons/search.svg" alt="" />
            <input className="min-w-0 flex-1 text-sm outline-none" aria-label="영화 검색어" placeholder="예: 스파이더맨" value={input} onChange={(event) => setInput(event.target.value)} />
            <button className="cursor-pointer rounded bg-[#202329] px-4 py-2 text-xs font-bold text-white" type="submit">검색</button>
          </form>
          <p className="mt-4 text-sm text-[#8a929f]">검색어를 입력해 영화를 찾아보세요.</p>
        </div>
      )}
    </main>
  )
}

function SearchResults({ query }: { query: string }) {
  const state = useTmdb<TmdbPage>('search/movie', { query })
  const bookmarkedIds = useBookmarkStore((state) => state.bookmarkedIds)
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)

  if (state.status === 'loading') return <StatusMessage>‘{query}’ 검색 중이에요...</StatusMessage>
  if (state.status === 'error') return <StatusMessage error onRetry={state.retry}>검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</StatusMessage>
  const results = state.data.results.map(toMovie)
  const total = state.data.total_results

  return (
    <>
      <div className="mt-5 flex items-center justify-between border-b border-[#e5e9ee] pb-2">
        <h2 className="text-sm font-bold">‘{query}’ 검색 결과</h2>
        <p className="text-xs text-[#8a929f]">{total}개의 영화</p>
      </div>
      {results.length ? (
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          {results.map((movie) => (
            <article key={movie.id} className="flex gap-3 border-b border-[#e5e9ee] py-5">
              <Link to={`/movies/${movie.id}`} className="w-[88px] shrink-0 overflow-hidden rounded-md bg-[#e7ecf3]">
                {movie.posterPath && <img className="aspect-[2/3] h-full w-full object-cover" src={movie.posterPath} alt={`${movie.title} 포스터`} />}
              </Link>
              <div className="min-w-0">
                <h3 className="text-sm font-bold"><Link to={`/movies/${movie.id}`} className="hover:text-[#2f73dc]">{movie.title}</Link></h3>
                <p className="mt-1 text-xs text-[#6b7280]">{movie.originalTitle} · {movie.releaseDate}</p>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#59606a]">{movie.overview}</p>
                <Link to={`/movies/${movie.id}`} className="mt-3 inline-block text-xs font-bold text-[#2f73dc]">상세 보기 →</Link>
                <button
                  type="button"
                  aria-label={`${movie.title} 북마크 ${bookmarkedIds.includes(movie.id) ? '해제' : '추가'}`}
                  aria-pressed={bookmarkedIds.includes(movie.id)}
                  onClick={() => toggleBookmark(movie.id)}
                  className="mt-3 ml-3 cursor-pointer rounded border border-[#dce2ea] px-3 py-1 text-xs font-bold aria-pressed:border-[#2f73dc] aria-pressed:bg-[#2f73dc] aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f73dc]"
                >
                  {bookmarkedIds.includes(movie.id) ? '북마크 해제' : '북마크하기'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="py-16 text-center text-[#6b7280]">‘{query}’에 대한 검색 결과가 없어요.</p>}
    </>
  )
}
