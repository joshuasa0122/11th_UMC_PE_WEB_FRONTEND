import { Link } from 'react-router'
import { cn } from '../lib/cn'
import { useBookmarkStore } from '../stores/bookmark-store'
import type { Movie } from '../types/movie'

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  const isBookmarked = useBookmarkStore((state) => state.bookmarkedIds.includes(movie.id))
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)
  return (
    <article className="min-w-0">
      <div className="relative aspect-[178/204] overflow-hidden rounded-md bg-[#e7ecf3]">
        <span className="absolute inset-0 grid place-items-center font-extrabold text-[#9ea9b7]" aria-hidden="true">UMCine</span>
        <Link to={`/movies/${movie.id}`} aria-label={`${movie.title} 상세 보기`} className="absolute inset-0 block">
          {movie.posterPath && <img src={movie.posterPath} alt={`${movie.title} 포스터`} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true }} />}
        </Link>
        <button
          className={cn('absolute top-[7px] right-[7px] grid h-[26px] w-[26px] cursor-pointer place-items-center rounded p-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f73dc]', isBookmarked ? 'bg-[#2f73dc] hover:bg-[#2f73dc]' : 'bg-[#262b2ee8] hover:bg-[#414a50]')}
          type="button"
          aria-label={`${movie.title} 북마크 ${isBookmarked ? '해제' : '추가'}`}
          aria-pressed={isBookmarked}
          onClick={() => toggleBookmark(movie.id)}
        >
          <img className="h-[22px] w-[22px] invert" src={isBookmarked ? '/icons/bookmark.svg' : '/icons/bookmark-outline.svg'} alt="" />
        </button>
      </div>
      <div className="pt-[6px]">
        <h2 className="truncate text-xs leading-[1.5] font-bold text-[#26282d]"><Link to={`/movies/${movie.id}`}>{movie.title}</Link></h2>
        <p className="mt-[2px] text-[11px] leading-[1.4] text-[#969da8]">{movie.releaseDate}</p>
      </div>
    </article>
  )
}
