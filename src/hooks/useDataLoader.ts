import { useState, useEffect } from 'react'
import type { University, UniversityScore, BatchLine } from '@/types'
import {
  loadUniversities,
  loadUniversityScores,
  loadBatchLines,
} from '@/utils/dataLoader'

interface UseDataLoaderReturn {
  loading: boolean
  error: string | null
  universities: University[]
  scores: UniversityScore[]
  batchLines: BatchLine[]
}

export function useDataLoader(): UseDataLoaderReturn {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [scores, setScores] = useState<UniversityScore[]>([])
  const [batchLines, setBatchLines] = useState<BatchLine[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [unis, scrs, bls] = await Promise.all([
          loadUniversities(),
          loadUniversityScores(),
          loadBatchLines(),
        ])
        if (!cancelled) {
          setUniversities(unis)
          setScores(scrs)
          setBatchLines(bls)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '数据加载失败')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { loading, error, universities, scores, batchLines }
}
