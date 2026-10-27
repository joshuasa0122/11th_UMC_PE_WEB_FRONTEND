import { useState } from 'react'
import { cn } from '../lib/cn'
import { MovieCard } from './movie-card'
import type { Movie } from '../types/movie'

interface MovieGridProps {
  movies: Movie[]
}

export function MovieGrid({ movies }: MovieGridProps) {
  const [cardSize, setCardSize] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('umcine-card-size') === 'large' ? 'large' : 'normal',
  )

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
