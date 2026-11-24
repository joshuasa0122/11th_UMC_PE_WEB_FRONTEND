'use client'

import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'
import { MovieCard } from './movie-card'
import type { Movie } from '../types/movie'

interface MovieGridProps {
  movies: Movie[]
}

export function MovieGrid({ movies }: MovieGridProps) {
  const [cardSize, setCardSize] = useState('normal')
  // localStorage는 브라우저에만 있어서, 서버 HTML과 첫 렌더를 맞춘 뒤 저장된 값을 읽어요.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- hydration 이후 외부 저장소(localStorage) 값과 맞추는 용도예요.
    if (localStorage.getItem('umcine-card-size') === 'large') setCardSize('large')
  }, [])

  return (
    <section aria-label="영화 목록">
      <div className="mb-3 flex justify-end">
        <label className="flex items-center gap-2 text-xs text-[#59606a]">
          카드 크기
          <select
            value={cardSize}
            onChange={(event) => {
              const size = event.target.value
              setCardSize(size)
              localStorage.setItem('umcine-card-size', size)
            }}
            className="rounded border border-[#dce2ea] bg-white px-2 py-1 text-[#202329] focus-visible:outline-2 focus-visible:outline-[#2f73dc]"
          >
            <option value="normal">보통</option>
            <option value="large">크게</option>
          </select>
        </label>
      </div>
      <div className={cn('grid grid-cols-1 gap-x-[15px] gap-y-[15px] min-[400px]:grid-cols-2', cardSize === 'large' ? 'min-[768px]:grid-cols-2 min-[950px]:grid-cols-3' : 'min-[768px]:grid-cols-3 min-[950px]:grid-cols-5')}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}
