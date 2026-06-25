import { create } from 'zustand'
import type { UserProfile, YearWeightConfig } from '@/types'

interface UserState {
  profile: UserProfile
  yearWeight: YearWeightConfig
  setProfile: (profile: Partial<UserProfile>) => void
  resetProfile: () => void
  setYearWeight: (config: YearWeightConfig) => void
}

const defaultProfile: UserProfile = {
  totalScore: 0,
  rank: 0,
  preferredSubject: 'physics',
  reselectedSubjects: [],
}

const defaultYearWeight: YearWeightConfig = {
  mode: 'equal',
  manualWeights: { '2022': 25, '2023': 25, '2024': 25, '2025': 25 },
}

export const useUserStore = create<UserState>((set) => ({
  profile: { ...defaultProfile },
  yearWeight: { ...defaultYearWeight },
  setProfile: (partial) =>
    set((state) => ({
      profile: { ...state.profile, ...partial },
    })),
  resetProfile: () => set({ profile: { ...defaultProfile } }),
  setYearWeight: (config) => set({ yearWeight: config }),
}))
