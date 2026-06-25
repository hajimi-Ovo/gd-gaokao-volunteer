import { useState, useEffect } from 'react'
import type { RecommendationResult, YearDifficultyResult } from '@/types'
import { getRecommendations } from '@/utils/recommendation'
import { useUserStore } from '@/store/userStore'

interface UseRecommendationReturn {
  loading: boolean
  error: string | null
  recommendations: RecommendationResult[]
  difficultyAnalysis: YearDifficultyResult[]
  refresh: () => void
}

export function useRecommendation(): UseRecommendationReturn {
  const { profile } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<YearDifficultyResult[]>([])

  const fetch = async () => {
    if (!profile.totalScore || !profile.rank) return

    setLoading(true)
    setError(null)

    try {
      const result = await getRecommendations(profile)
      setRecommendations(result.recommendations)
      setDifficultyAnalysis(result.difficultyAnalysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : '推荐计算失败')
      console.error('Recommendation error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [profile.totalScore, profile.rank, profile.preferredSubject])

  return { loading, error, recommendations, difficultyAnalysis, refresh: fetch }
}
