import ky, { HTTPError } from 'ky'
import { useEffect, useState } from 'react'
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

type TmdbState<T> =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean; retry: () => void }
  | { status: 'success'; data: T }

export function useTmdb<T>(path: string, params: Record<string, string> = {}): TmdbState<T> {
  const searchParams = new URLSearchParams({ language: 'ko-KR', ...params }).toString()
  const [attempt, setAttempt] = useState(0)
  const key = `${path}?${searchParams}#${attempt}`
  const [result, setResult] = useState<{ key: string; data?: T; error?: unknown }>()

  useEffect(() => {
    const controller = new AbortController()
    tmdb.get(path, { searchParams, signal: controller.signal }).json<T>().then(
      (data) => setResult({ key, data }),
      (error) => { if (!controller.signal.aborted) setResult({ key, error }) },
    )
    return () => controller.abort()
  }, [key, path, searchParams])

  if (result?.key !== key) return { status: 'loading' }
  if (result.error) return {
    status: 'error',
    notFound: result.error instanceof HTTPError && result.error.response.status === 404,
    retry: () => setAttempt((count) => count + 1),
  }
  return { status: 'success', data: result.data as T }
}
