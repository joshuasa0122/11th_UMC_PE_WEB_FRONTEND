import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { MovieGrid } from '../components/movie-grid'
import { Pagination } from '../components/pagination'
import { StatusMessage } from '../components/status-message'
import { movieQueries, toMovie } from '../lib/tmdb'

// TMDB는 page 500까지만 허용해요.
const MAX_PAGE = 500

export function MovieListPage() {
  const [searchParams] = useSearchParams()
  const page = Math.min(Math.max(Math.trunc(Number(searchParams.get('page'))) || 1, 1), MAX_PAGE)
  const { data, isPending, isError, refetch } = useQuery(movieQueries.popular(page))

  useEffect(() => window.scrollTo(0, 0), [page])

  return (
    <main className="mx-auto w-full max-w-[1060px] flex-1 px-5 pt-[22px] pb-12 min-[651px]:px-[58px]">
      <h1 className="mb-[17px] text-[27px] leading-[1.3] font-bold tracking-[-.06em]">영화 목록</h1>
      {isPending && <StatusMessage>영화 목록을 불러오는 중이에요...</StatusMessage>}
      {isError && <StatusMessage error onRetry={() => refetch()}>영화 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</StatusMessage>}
      {data && (data.results.length ? (
        <>
          <MovieGrid movies={data.results.map(toMovie)} />
          <Pagination currentPage={page} totalPages={Math.min(data.total_pages, MAX_PAGE)} />
        </>
      ) : <StatusMessage>표시할 영화가 없어요.</StatusMessage>)}
    </main>
  )
}
