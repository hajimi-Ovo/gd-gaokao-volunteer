import { useState, useEffect, useRef } from 'react'
import type { RecommendationResult } from '@/types'
import { getRecommendations } from '@/utils/recommendation'
import { useUserStore } from '@/store/userStore'

interface UseRecommendationReturn {
  loading: boolean
  error: string | null
  recommendations: RecommendationResult[]
  refresh: () => void
}

export function useRecommendation(): UseRecommendationReturn {
  const { profile, yearWeight } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  // 用计数器强制刷新，避免 useCallback 闭包陷阱
  const [tick, setTick] = useState(0)

  // 跟踪上一次成功请求的参数，避免重复请求
  const lastKey = useRef('')

  const refresh = () => setTick((t) => t + 1)

  useEffect(() => {
    if (!profile.totalScore || !profile.rank) return

    // 构建当前参数 key，检测是否真的有变化
    const key = JSON.stringify({
      score: profile.totalScore,
      rank: profile.rank,
      subject: profile.preferredSubject,
      province: profile.provincePreference || [],
      major: profile.majorPreference || [],
      majorSub: profile.majorSubPreference || [],
      level: profile.levelPreference || [],
      weightMode: yearWeight.mode,
      weightManual: yearWeight.manualWeights,
      tick,
    })

    // 未变化则跳过（除 refresh 触发的 tick 变化外）
    if (key === lastKey.current && tick === 0) return
    lastKey.current = key

    let cancelled = false
    setLoading(true)
    setError(null)

    getRecommendations(profile, yearWeight.manualWeights, yearWeight.mode)
      .then((result) => {
        if (!cancelled) {
          setRecommendations(result.recommendations)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '推荐计算失败')
          console.error('Recommendation error:', e)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [
    profile.totalScore,
    profile.rank,
    profile.preferredSubject,
    profile.provincePreference,
    profile.majorPreference,
    profile.majorSubPreference,
    profile.levelPreference,
    yearWeight.mode,
    yearWeight.manualWeights,
    tick,
  ])

  return { loading, error, recommendations, refresh }
}
