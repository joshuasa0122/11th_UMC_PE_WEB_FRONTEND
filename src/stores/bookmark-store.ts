import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface BookmarkState {
  bookmarkedIds: number[]
  toggleBookmark: (id: number) => void
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set) => ({
      bookmarkedIds: [],
      toggleBookmark: (id) => set((state) => ({
        bookmarkedIds: state.bookmarkedIds.includes(id)
          ? state.bookmarkedIds.filter((bookmarkId) => bookmarkId !== id)
          : [...state.bookmarkedIds, id],
      })),
    }),
    {
      name: 'umcine-bookmark-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bookmarkedIds: state.bookmarkedIds }),
      merge: (persisted, current) => {
        const ids = (persisted as Partial<BookmarkState> | null)?.bookmarkedIds
        return {
          ...current,
          bookmarkedIds: Array.isArray(ids)
            ? [...new Set(ids.filter((id) => Number.isSafeInteger(id) && id > 0))]
            : [],
        }
      },
    },
  ),
)
