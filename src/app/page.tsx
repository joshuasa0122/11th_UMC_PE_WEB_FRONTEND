import { MAX_PAGE } from '../lib/tmdb'
import { MovieListPage } from './movie-list-page'

// Server Component: searchParams를 검증해서 숫자 page만 Client Component에 넘겨요.
export default async function Page({ searchParams }: PageProps<'/'>) {
  const { page } = await searchParams
  return <MovieListPage page={Math.min(Math.max(Math.trunc(Number(page)) || 1, 1), MAX_PAGE)} />
}
