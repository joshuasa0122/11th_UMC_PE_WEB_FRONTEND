import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  memberId: number | null
  login: (accessToken: string, memberId: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      memberId: null,
      login: (accessToken, memberId) => set({ accessToken, memberId }),
      logout: () => set({ accessToken: null, memberId: null }),
    }),
    { name: 'umcine-auth', storage: createJSONStorage(() => localStorage) },
  ),
)
