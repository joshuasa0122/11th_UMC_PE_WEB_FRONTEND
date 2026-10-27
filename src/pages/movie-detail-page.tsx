import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { StatusMessage } from '../components/status-message'
import { cn } from '../lib/cn'
import { toMovie, useTmdb, type TmdbMovie } from '../lib/tmdb'
import { useBookmarkStore } from '../stores/bookmark-store'

export function MovieDetailPage() {
  const { movieId = '' } = useParams()
  const state = useTmdb<TmdbMovie>(`movie/${encodeURIComponent(movieId)}`)
  const isBookmarked = useBookmarkStore((state) => state.bookmarkedIds.includes(Number(movieId)))
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)
  const [rating, setRating] = useState(() => typeof window === 'undefined' ? 0 : Number(localStorage.getItem(`umcine-rating-${movieId}`) ?? 0))
  const [review, setReview] = useState(() => typeof window === 'undefined' ? '' : localStorage.getItem(`umcine-review-${movieId}`) ?? '')
  const [saved, setSaved] = useState(false)

  if (state.status !== 'success') return (
    <main className="mx-auto w-full max-w-[1060px] flex-1 px-5 py-10 min-[651px]:px-[58px]">
      {state.status === 'loading' && <StatusMessage>영화 정보를 불러오는 중이에요...</StatusMessage>}
      {state.status === 'error' && (state.notFound
        ? <StatusMessage>영화를 찾을 수 없어요.</StatusMessage>
        : <StatusMessage error onRetry={state.retry}>영화 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</StatusMessage>)}
    </main>
  )

  const movie = toMovie(state.data)
  const meta = [...movie.genres, movie.runtime].filter(Boolean).join(' · ')

  return (
    <main className="w-full flex-1">
      <section className="relative mx-auto h-[280px] max-w-[1060px] overflow-hidden bg-[#202329] text-white">
        <img className="absolute inset-0 h-full w-full object-cover object-center" src={movie.backdropPath} alt="" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1060px] flex-col justify-between px-5 py-5 min-[651px]:px-[58px]">
          <Link to="/" className="text-xs font-semibold text-white hover:underline">‹ 영화 목록</Link>
          <div>
            <h1 className="text-[26px] leading-tight font-extrabold tracking-[-.05em] min-[651px]:text-[34px]">{movie.title}</h1>
            <p className="mt-2 text-xs text-white/80">{movie.originalTitle}</p>
            <p className="mt-2 text-xs text-white/80">{[movie.releaseDate, meta].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
      </section>
      <div className="mx-auto grid w-full max-w-[1060px] gap-6 px-5 py-5 min-[651px]:px-[58px] md:grid-cols-[150px_minmax(0,1fr)_230px]">
        {movie.posterPath ? <img className="w-[150px] rounded border-[5px] border-[#f5c400] object-cover shadow-md" src={movie.posterPath} alt={`${movie.title} 포스터`} /> : <div className="aspect-[2/3] w-[150px] rounded bg-[#e7ecf3]" />}
        <section>
          {movie.tagline && <h2 className="text-lg font-bold">{movie.tagline}</h2>}
          <p className="mt-3 text-sm leading-6 text-[#59606a]">{movie.overview}</p>
          <p className="mt-2 text-xs text-[#8a929f]">{[meta, movie.releaseDate].filter(Boolean).join(' · ')}</p>
          <button type="button" onClick={() => toggleBookmark(movie.id)} aria-pressed={isBookmarked} className={cn('mt-5 cursor-pointer rounded px-4 py-2 text-xs font-bold text-white', isBookmarked ? 'bg-[#202329]' : 'bg-[#2f73dc]')}>
            {isBookmarked ? '북마크 해제' : '북마크하기'}
          </button>
        </section>
        <section className="border-t border-[#e5e9ee] pt-4 md:border-t-0 md:border-l md:pl-5 md:pt-0">
          <h2 className="text-sm font-bold">내 평점</h2>
          <p className="mt-2 text-xs text-[#8a929f]">영화를 보고 느낀 점을 남겨보세요.</p>
          <div className="mt-3 flex gap-1" aria-label="별점 선택">
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value}점`} aria-pressed={rating === value} onClick={() => { setRating(value); setSaved(false) }} className={cn('cursor-pointer rounded border border-[#e5e9ee] px-2 py-1 text-lg', value <= rating ? 'text-[#f5c400]' : 'text-[#9ca3af]')}>★</button>)}
          </div>
          <textarea aria-label="영화 감상" placeholder="영화에 대한 감상을 남겨보세요." value={review} onChange={(event) => { setReview(event.target.value); setSaved(false) }} className="mt-3 h-20 w-full resize-y rounded border border-[#e5e9ee] bg-white p-2 text-xs outline-[#2f73dc]" />
          <button type="button" disabled={rating === 0} onClick={() => { localStorage.setItem(`umcine-rating-${movieId}`, String(rating)); localStorage.setItem(`umcine-review-${movieId}`, review); setSaved(true) }} className="mt-2 w-full cursor-pointer rounded bg-[#202329] py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">별점 저장</button>
          {saved && <p role="status" className="mt-2 text-xs text-[#2f73dc]">별점이 저장되었어요.</p>}
        </section>
      </div>
    </main>
  )
}
