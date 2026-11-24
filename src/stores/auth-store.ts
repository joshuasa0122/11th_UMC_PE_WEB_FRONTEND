import { useSyncExternalStore } from 'react'
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
    // 서버에는 localStorage가 없어요. 복원은 브라우저에서 Providers가 rehydrate()로 해요.
    { name: 'umcine-auth', storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
)

// localStorage에서 로그인 정보를 다 읽었는지 알려 줘요. 서버와 첫 렌더에서는 false예요.
// 서버에는 localStorage가 없어 persist API(useAuthStore.persist)가 붙지 않아요. 브라우저에서만 부르는 함수 안에서 꺼내요.
export const useAuthHydrated = () => useSyncExternalStore(
  (onChange) => useAuthStore.persist.onFinishHydration(onChange),
  () => useAuthStore.persist.hasHydrated(),
  () => false,
)
