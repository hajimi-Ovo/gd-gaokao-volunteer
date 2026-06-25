import type { VolunteerPlan } from '@/types'

const STORAGE_KEY_PREFIX = 'gaokao_volunteer_'

/**
 * 保存志愿方案到本地存储
 */
export function saveVolunteerPlan(plan: VolunteerPlan): void {
  try {
    const key = STORAGE_KEY_PREFIX + plan.id
    localStorage.setItem(key, JSON.stringify(plan))
    // 同时更新方案列表索引
    const index = getPlanIndex()
    const existingIdx = index.findIndex((p) => p.id === plan.id)
    if (existingIdx >= 0) {
      index[existingIdx] = { id: plan.id, name: plan.name, updateTime: plan.updateTime }
    } else {
      index.push({ id: plan.id, name: plan.name, updateTime: plan.updateTime })
    }
    localStorage.setItem(STORAGE_KEY_PREFIX + 'index', JSON.stringify(index))
  } catch (e) {
    console.error('Failed to save volunteer plan:', e)
  }
}

/**
 * 加载单个志愿方案
 */
export function loadVolunteerPlan(planId: string): VolunteerPlan | null {
  try {
    const key = STORAGE_KEY_PREFIX + planId
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.error('Failed to load volunteer plan:', e)
    return null
  }
}

/**
 * 获取所有已保存的方案列表
 */
export function getPlanIndex(): Array<{ id: string; name: string; updateTime: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + 'index')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * 删除志愿方案
 */
export function deleteVolunteerPlan(planId: string): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + planId)
    const index = getPlanIndex().filter((p) => p.id !== planId)
    localStorage.setItem(STORAGE_KEY_PREFIX + 'index', JSON.stringify(index))
  } catch (e) {
    console.error('Failed to delete volunteer plan:', e)
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
