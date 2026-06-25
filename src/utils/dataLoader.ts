import type { University, UniversityScore, BatchLine, ScoreRankEntry } from '@/types'

/** 数据缓存 */
let universitiesCache: University[] | null = null
let scoresCache: UniversityScore[] | null = null
let batchLinesCache: BatchLine[] | null = null
let scoreRankingCache: Record<string, Record<string, ScoreRankEntry[]>> | null = null
let subjectRequirementsCache: Record<string, { preferred_subject: string; reselected_subjects: string[] }> | null = null

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.statusText}`)
  }
  return response.json()
}

/** 加载院校信息 */
export async function loadUniversities(): Promise<University[]> {
  if (universitiesCache) return universitiesCache
  universitiesCache = await fetchJSON<University[]>('/data/universities.json')
  return universitiesCache!
}

/** 加载院校历年投档线 */
export async function loadUniversityScores(): Promise<UniversityScore[]> {
  if (scoresCache) return scoresCache
  scoresCache = await fetchJSON<UniversityScore[]>('/data/university_scores.json')
  return scoresCache!
}

/** 加载批次线 */
export async function loadBatchLines(): Promise<BatchLine[]> {
  if (batchLinesCache) return batchLinesCache
  batchLinesCache = await fetchJSON<BatchLine[]>('/data/batch_lines.json')
  return batchLinesCache!
}

/** 加载一分一段表 */
export async function loadScoreRanking(): Promise<Record<string, Record<string, ScoreRankEntry[]>>> {
  if (scoreRankingCache) return scoreRankingCache
  scoreRankingCache = await fetchJSON<Record<string, Record<string, ScoreRankEntry[]>>>('/data/score_ranking.json')
  return scoreRankingCache!
}

/** 加载选科要求 */
export async function loadSubjectRequirements(): Promise<Record<string, { preferred_subject: string; reselected_subjects: string[] }>> {
  if (subjectRequirementsCache) return subjectRequirementsCache
  const raw = await fetchJSON<Array<{
    id: string
    university_id: string
    group_code: string
    preferred_subject: string
    reselected_subjects: string[]
  }>>('/data/subject_requirements.json')
  subjectRequirementsCache = {}
  for (const item of raw) {
    subjectRequirementsCache[`${item.university_id}_${item.group_code}`] = {
      preferred_subject: item.preferred_subject,
      reselected_subjects: item.reselected_subjects,
    }
  }
  return subjectRequirementsCache!
}

/** 清除数据缓存（用于调试） */
export function clearCache() {
  universitiesCache = null
  scoresCache = null
  batchLinesCache = null
  scoreRankingCache = null
  subjectRequirementsCache = null
}
