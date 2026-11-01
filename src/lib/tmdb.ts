import ky, { HTTPError } from 'ky'
import { queryOptions } from '@tanstack/react-query'
import type { Movie } from '../types/movie'

export const tmdb = ky.create({
  prefix: 'https://api.themoviedb.org/3',
  headers: { Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}` },
})

export interface TmdbMovie {
  id: number
  title: string
  original_title: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  genres?: { id: number; name: string }[]
  runtime?: number | null
  tagline?: string
}

export interface TmdbPage {
  page: number
  results: TmdbMovie[]
  total_pages: number
  total_results: number
}

const image = (size: string, path: string | null) => path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined

export function toMovie(movie: TmdbMovie): Movie {
  const runtime = movie.runtime ?? 0
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    releaseDate: movie.release_date ? movie.release_date.replaceAll('-', '.') : '개봉일 미정',
    posterPath: image('w500', movie.poster_path),
    backdropPath: image('w1280', movie.backdrop_path),
    genres: movie.genres?.map((genre) => genre.name) ?? [],
    runtime: runtime ? `${Math.floor(runtime / 60)}시간 ${runtime % 60}분` : '',
    tagline: movie.tagline ?? '',
    overview: movie.overview || '등록된 줄거리가 없어요.',
  }
}

const get = <T>(path: string, params: Record<string, string>, signal: AbortSignal) =>
  tmdb.get(path, { searchParams: { language: 'ko-KR', ...params }, signal }).json<T>()

export const isNotFound = (error: unknown) => error instanceof HTTPError && error.response.status === 404

export const movieQueries = {
  popular: (page: number) => queryOptions({
    queryKey: ['movies', 'popular', page],
    queryFn: ({ signal }) => get<TmdbPage>('movie/popular', { page: String(page) }, signal),
  }),
  search: (query: string) => queryOptions({
    queryKey: ['movies', 'search', query],
    queryFn: ({ signal }) => get<TmdbPage>('search/movie', { query }, signal),
  }),
  detail: (movieId: string) => queryOptions({
    queryKey: ['movies', 'detail', movieId],
    queryFn: ({ signal }) => get<TmdbMovie>(`movie/${encodeURIComponent(movieId)}`, {}, signal),
  }),
}
