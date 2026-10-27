import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function StatusMessage({ children, error = false, onRetry }: { children: ReactNode; error?: boolean; onRetry?: () => void }) {
  return (
    <div className="py-16 text-center">
      <p role={error ? 'alert' : 'status'} className={cn('text-sm', error ? 'text-[#d64545]' : 'text-[#6b7280]')}>{children}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 cursor-pointer rounded bg-[#202329] px-4 py-2 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f73dc]">다시 시도</button>}
    </div>
  )
}
