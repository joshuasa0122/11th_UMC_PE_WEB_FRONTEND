'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { StatusMessage } from '../../../components/status-message'
import { cn } from '../../../lib/cn'
import { errorMessage, favoriteMutations, favoriteQueries, memberQueries, ratingMutations, type Rating } from '../../../lib/api'
import { isNotFound, movieQueries, toMovie } from '../../../lib/tmdb'
import { useAuthStore } from '../../../stores/auth-store'

export function MovieDetailPage({ movieId }: { movieId: string }) {
  const { data, error, isPending, refetch } = useQuery(movieQueries.detail(movieId))
  const memberId = useAuthStore((state) => state.memberId)

  if (!data) return (
    <main className="mx-auto w-full max-w-[1060px] flex-1 px-5 py-10 min-[651px]:px-[58px]">
      {isPending && <StatusMessage>영화 정보를 불러오는 중이에요...</StatusMessage>}
      {error && (isNotFound(error)
        ? <StatusMessage>영화를 찾을 수 없어요.</StatusMessage>
        : <StatusMessage error onRetry={() => refetch()}>영화 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</StatusMessage>)}
    </main>
  )

  const movie = toMovie(data)
  const meta = [...movie.genres, movie.runtime].filter(Boolean).join(' · ')

  return (
    <main className="w-full flex-1">
      <section className="relative mx-auto h-[280px] max-w-[1060px] overflow-hidden bg-[#202329] text-white">
        <img className="absolute inset-0 h-full w-full object-cover object-center" src={movie.backdropPath} alt="" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1060px] flex-col justify-between px-5 py-5 min-[651px]:px-[58px]">
          <Link href="/" className="text-xs font-semibold text-white hover:underline">‹ 영화 목록</Link>
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
          {memberId ? <FavoriteButton movieId={movie.id} /> : <LoginLink>로그인하고 즐겨찾기</LoginLink>}
        </section>
        <section className="border-t border-[#e5e9ee] pt-4 md:border-t-0 md:border-l md:pl-5 md:pt-0">
          <h2 className="text-sm font-bold">내 평점</h2>
          <p className="mt-2 text-xs text-[#8a929f]">영화를 보고 느낀 점을 남겨보세요.</p>
          {memberId ? <MyRating memberId={memberId} movieId={movie.id} /> : <LoginLink>로그인하고 평점 남기기</LoginLink>}
        </section>
      </div>
    </main>
  )
}

function LoginLink({ children }: { children: string }) {
  const pathname = usePathname()
  return <Link href={`/login?${new URLSearchParams({ redirect: pathname })}`} className="mt-5 inline-block rounded bg-[#2f73dc] px-4 py-2 text-xs font-bold text-white">{children}</Link>
}

function FavoriteButton({ movieId }: { movieId: number }) {
  const { data, isPending } = useQuery(favoriteQueries.status(movieId))
  const add = useMutation(favoriteMutations.add(movieId))
  const remove = useMutation(favoriteMutations.remove(movieId))
  const isFavorite = data?.isFavorite ?? false
  const error = add.error ?? remove.error

  return (
    <>
      <button
        type="button"
        disabled={isPending || add.isPending || remove.isPending}
        onClick={() => (isFavorite ? remove : add).mutate()}
        aria-pressed={isFavorite}
        className={cn('mt-5 cursor-pointer rounded px-4 py-2 text-xs font-bold text-white disabled:cursor-default disabled:opacity-50', isFavorite ? 'bg-[#202329]' : 'bg-[#2f73dc]')}
      >
        {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-[#d64545]">{errorMessage(error)}</p>}
    </>
  )
}

function MyRating({ memberId, movieId }: { memberId: number; movieId: number }) {
  // 영화별 조회 API가 없어서 내 평점 목록에서 이 영화를 찾아요.
  const { data: myRating, isPending, isError } = useQuery({
    ...memberQueries.ratings(memberId),
    select: (ratings) => ratings.find((rating) => rating.movieId === movieId) ?? null,
  })

  if (isPending) return <p role="status" className="mt-3 text-xs text-[#8a929f]">내 평점을 불러오는 중이에요...</p>
  if (isError) return <p role="alert" className="mt-3 text-xs text-[#d64545]">내 평점을 불러오지 못했어요.</p>
  // 저장된 평점이 바뀌면 입력 폼을 새 값으로 다시 시작해요.
  return <RatingForm key={myRating?.updatedAt ?? 'new'} memberId={memberId} movieId={movieId} myRating={myRating} />
}

function RatingForm({ memberId, movieId, myRating }: { memberId: number; movieId: number; myRating: Rating | null }) {
  const [score, setScore] = useState(myRating?.score ?? 0)
  const [comment, setComment] = useState(myRating?.comment ?? '')
  const create = useMutation(ratingMutations.create(memberId))
  const update = useMutation(ratingMutations.update(memberId))
  const remove = useMutation(ratingMutations.remove(memberId))
  const busy = create.isPending || update.isPending || remove.isPending
  const error = create.error ?? update.error ?? remove.error

  function save() {
    if (myRating) update.mutate({ ratingId: myRating.ratingId, score, comment })
    else create.mutate({ movieId, score, comment })
  }

  return (
    <>
      <div className="mt-3 flex gap-1" aria-label="별점 선택">
        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value}점`} aria-pressed={score === value} onClick={() => setScore(value)} className={cn('cursor-pointer rounded border border-[#e5e9ee] px-2 py-1 text-lg', value <= score ? 'text-[#f5c400]' : 'text-[#9ca3af]')}>★</button>)}
      </div>
      <textarea aria-label="영화 감상" maxLength={500} placeholder="영화에 대한 감상을 남겨보세요." value={comment} onChange={(event) => setComment(event.target.value)} className="mt-3 h-20 w-full resize-y rounded border border-[#e5e9ee] bg-white p-2 text-xs outline-[#2f73dc]" />
      <button type="button" disabled={score === 0 || busy} onClick={save} className="mt-2 w-full cursor-pointer rounded bg-[#202329] py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{myRating ? '평점 수정' : '평점 등록'}</button>
      {myRating && <button type="button" disabled={busy} onClick={() => remove.mutate(myRating.ratingId)} className="mt-2 w-full cursor-pointer rounded border border-[#e5e9ee] py-2 text-xs font-bold text-[#d64545] disabled:opacity-50">평점 삭제</button>}
      {error && <p role="alert" className="mt-2 text-xs text-[#d64545]">{errorMessage(error)}</p>}
      {myRating && !error && <p className="mt-2 text-[11px] text-[#8a929f]">마지막 수정 {myRating.updatedAt.slice(0, 16).replace('T', ' ')}</p>}
    </>
  )
}
