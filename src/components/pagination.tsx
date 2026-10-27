import { Link } from 'react-router'
import { cn } from '../lib/cn'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const first = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index)

  return (
    <nav className="mt-10 flex justify-center" aria-label="페이지 번호">
      <ol className="flex gap-[7px]">
        {pages.map((page) => (
          <li key={page}>
            <Link
              to={`?page=${page}`}
              className={cn('grid h-[27px] min-w-[27px] place-items-center rounded px-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f73dc]', page === currentPage ? 'bg-[#2f73dc] font-bold text-white' : 'text-[#7b8492]')}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
