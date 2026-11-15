import { useQueries, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { StatusMessage } from '../../../components/status-message'
import { favoriteQueries, memberQueries } from '../../../lib/api'
import { movieQueries, toMovie } from '../../../lib/tmdb'

export const Route = createFileRoute('/(auth)/me/')({ component: MyPage })

function MyPage() {
  const me = useQuery(memberQueries.me())
  const favorites = useQuery(favoriteQueries.list())
  // 서버는 movieId만 저장해요. 제목·포스터는 상세 화면과 같은 TMDB 캐시를 함께 써요.
  const movies = useQueries({ queries: (favorites.data ?? []).map((favorite) => movieQueries.detail(String(favorite.movieId))) })

  return (
    <main className="mx-auto w-full max-w-[760px] flex-1 px-5 py-14">
      <h1 className="mb-8 text-[27px] font-bold tracking-[-.06em]">마이페이지</h1>
      <section className="rounded-lg border border-[#e7ebf1] bg-white p-6">
        {me.isPending ? <p role="status" className="text-sm text-[#6b7280]">내 정보를 불러오는 중이에요...</p>
          : me.isError ? <p role="alert" className="text-sm text-[#d64545]">내 정보를 불러오지 못했어요.</p>
          : (
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[#eef3fb]"><img className="h-8 w-8 opacity-60" src="/icons/person.svg" alt="" /></span>
              <div>
                <p className="text-lg font-bold">{me.data.nickname}</p>
                <p className="text-[13px] text-[#6b7280]">{me.data.email}</p>
                <p className="mt-1 text-[11px] text-[#8a929f]">가입일 {me.data.createdAt.slice(0, 10).replaceAll('-', '.')}</p>
              </div>
              <Link to="/me/edit" className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#dce2ea] px-4 py-2 text-xs font-bold hover:border-[#2f73dc]">
                <img className="h-4 w-4" src="/icons/edit.svg" alt="" />정보 수정
              </Link>
            </div>
          )}
      </section>

      <h2 className="mt-10 mb-4 text-lg font-bold">즐겨찾기한 영화 {favorites.data && <span className="text-sm text-[#8a929f]">{favorites.data.length}</span>}</h2>
      {favorites.isPending && <StatusMessage>즐겨찾기를 불러오는 중이에요...</StatusMessage>}
      {favorites.isError && <StatusMessage error onRetry={() => favorites.refetch()}>즐겨찾기를 불러오지 못했어요.</StatusMessage>}
      {favorites.data?.length === 0 && <StatusMessage>아직 즐겨찾기한 영화가 없어요.</StatusMessage>}
      {!!favorites.data?.length && (
        <ul className="grid grid-cols-2 gap-4 min-[560px]:grid-cols-4">
          {favorites.data.map((favorite, index) => {
            const movie = movies[index]?.data && toMovie(movies[index].data)
            return (
              <li key={favorite.favoriteId}>
                <Link to="/movies/$movieId" params={{ movieId: String(favorite.movieId) }} className="block">
                  <div className="aspect-[2/3] overflow-hidden rounded-md bg-[#e7ecf3]">
                    {movie?.posterPath && <img className="h-full w-full object-cover" src={movie.posterPath} alt={`${movie.title} 포스터`} loading="lazy" />}
                  </div>
                  <p className="mt-2 truncate text-xs font-bold">{movie?.title ?? `영화 #${favorite.movieId}`}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
