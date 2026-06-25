import { useCallback } from 'react'
import { useVolunteerStore } from '@/store/volunteerStore'
import type { VolunteerItem, RecommendationResult, VolunteerCheckResult } from '@/types'
import { generateId } from '@/utils/storage'

export function useVolunteerList() {
  const store = useVolunteerStore()

  /** 从推荐结果添加志愿 */
  const addFromRecommendation = useCallback(
    (rec: RecommendationResult) => {
      const item: VolunteerItem = {
        id: generateId(),
        universityId: rec.university.id,
        universityName: rec.university.name,
        groupCode: rec.groupCode,
        groupName: rec.groupName,
        category: rec.category,
        order: store.plans.find((p) => p.id === store.currentPlanId)?.items.length ?? 0,
        predictedRank: rec.predictedMinRank,
        probability: rec.probabilityLabel,
      }
      store.addItem(item)
    },
    [store]
  )

  /** 检查志愿合理性 */
  const checkPlan = useCallback((): VolunteerCheckResult => {
    const plan = store.plans.find((p) => p.id === store.currentPlanId)
    if (!plan || plan.items.length === 0) {
      return { passed: false, warnings: ['志愿表为空'], suggestions: ['请添加志愿'], score: 0 }
    }

    const warnings: string[] = []
    const suggestions: string[] = []

    const chongItems = plan.items.filter((i) => i.category === 'chong')
    const wenItems = plan.items.filter((i) => i.category === 'wen')
    const baoItems = plan.items.filter((i) => i.category === 'bao')

    // 检查冲稳保比例
    const total = plan.items.length
    const chongRatio = chongItems.length / total
    const wenRatio = wenItems.length / total
    const baoRatio = baoItems.length / total

    if (chongRatio > 0.5) {
      warnings.push(`冲刺志愿占比 ${Math.round(chongRatio * 100)}%，过高，有滑档风险`)
    }
    if (baoRatio < 0.1) {
      warnings.push(`保底志愿占比 ${Math.round(baoRatio * 100)}%，过低，存在录取风险`)
    }
    if (wenRatio > 0.6) {
      suggestions.push('稳妥志愿较多，可考虑增加冲刺志愿')
    }

    // 检查志愿是否有梯度
    const sorted = [...plan.items].sort((a, b) => a.predictedRank - b.predictedRank)
    for (let i = 1; i < sorted.length; i++) {
      const gap =
        Math.abs(sorted[i].predictedRank - sorted[i - 1].predictedRank) /
        Math.max(sorted[i].predictedRank, 1)
      if (gap < 0.02) {
        warnings.push(
          `志愿 ${i} 和 ${i + 1}（${sorted[i].universityName} 和 ${sorted[i - 1].universityName}）排名过于接近`
        )
      }
    }

    // 检查是否超过 45 个
    if (total > 45) {
      warnings.push('志愿数量超过广东省 45 个上限')
    }

    const score = Math.max(0, 100 - warnings.length * 20 - suggestions.length * 5)
    const passed = warnings.length === 0

    return { passed, warnings, suggestions, score }
  }, [store])

  return {
    ...store,
    addFromRecommendation,
    checkPlan,
  }
}
