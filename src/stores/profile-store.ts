import { create } from 'zustand'

export interface Profile {
  nickname: string
  email: string
  bio: string
}

interface ProfileState {
  profile: Profile
  updateProfile: (profile: Profile) => void
}

// ponytail: API 연동 전이라 더미 프로필을 메모리에 보관, 로그인 API 연결 후 서버 응답으로 교체
export const useProfileStore = create<ProfileState>()((set) => ({
  profile: { nickname: '노코', email: 'noco@umc.com', bio: '주말마다 영화 한 편씩 봐요.' },
  updateProfile: (profile) => set({ profile }),
}))
