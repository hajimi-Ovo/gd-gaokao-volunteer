import { create } from 'zustand'
import type { UserProfile } from '@/types'

interface UserState {
  profile: UserProfile
  setProfile: (profile: Partial<UserProfile>) => void
  resetProfile: () => void
}

const defaultProfile: UserProfile = {
  totalScore: 0,
  rank: 0,
  preferredSubject: 'physics',
  reselectedSubjects: [],
}

export const useUserStore = create<UserState>((set) => ({
  profile: { ...defaultProfile },
  setProfile: (partial) =>
    set((state) => ({
      profile: { ...state.profile, ...partial },
    })),
  resetProfile: () => set({ profile: { ...defaultProfile } }),
}))
