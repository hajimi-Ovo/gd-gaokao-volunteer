import { create } from 'zustand'
import type { VolunteerItem, VolunteerPlan } from '@/types'

interface VolunteerState {
  plans: VolunteerPlan[]
  currentPlanId: string | null
  setCurrentPlan: (planId: string) => void
  addPlan: (plan: VolunteerPlan) => void
  addItem: (item: VolunteerItem) => void
  removeItem: (itemId: string) => void
  reorderItems: (items: VolunteerItem[]) => void
  updateItem: (itemId: string, updates: Partial<VolunteerItem>) => void
  clearCurrentPlan: () => void
}

export const useVolunteerStore = create<VolunteerState>((set) => ({
  plans: [],
  currentPlanId: null,

  setCurrentPlan: (planId) => set({ currentPlanId: planId }),

  addPlan: (plan) =>
    set((state) => ({
      plans: [...state.plans, plan],
      currentPlanId: plan.id,
    })),

  addItem: (item) =>
    set((state) => {
      const plan = state.plans.find((p) => p.id === state.currentPlanId)
      if (!plan) return state
      const updatedPlan = {
        ...plan,
        items: [...plan.items, item],
        updateTime: new Date().toISOString(),
      }
      return {
        plans: state.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
      }
    }),

  removeItem: (itemId) =>
    set((state) => {
      const plan = state.plans.find((p) => p.id === state.currentPlanId)
      if (!plan) return state
      const updatedPlan = {
        ...plan,
        items: plan.items.filter((i) => i.id !== itemId),
        updateTime: new Date().toISOString(),
      }
      return {
        plans: state.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
      }
    }),

  reorderItems: (items) =>
    set((state) => {
      const plan = state.plans.find((p) => p.id === state.currentPlanId)
      if (!plan) return state
      const updatedPlan = { ...plan, items, updateTime: new Date().toISOString() }
      return {
        plans: state.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
      }
    }),

  updateItem: (itemId, updates) =>
    set((state) => {
      const plan = state.plans.find((p) => p.id === state.currentPlanId)
      if (!plan) return state
      const updatedPlan = {
        ...plan,
        items: plan.items.map((i) =>
          i.id === itemId ? { ...i, ...updates } : i
        ),
        updateTime: new Date().toISOString(),
      }
      return {
        plans: state.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
      }
    }),

  clearCurrentPlan: () =>
    set((state) => {
      const plan = state.plans.find((p) => p.id === state.currentPlanId)
      if (!plan) return state
      const updatedPlan = { ...plan, items: [], updateTime: new Date().toISOString() }
      return {
        plans: state.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
      }
    }),
}))
