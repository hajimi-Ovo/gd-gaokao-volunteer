import type {
  UserProfile,
  University,
  RecommendationResult,
  ExamCategory,
  YearDifficultyResult,
} from '@/types'
import {
  loadUniversities,
  loadUniversityScores,
} from './dataLoader'
import {
  initRankingData,
  getDifficultyWeights,
  calculateYearSimilarity,
  rankToScore,
} from './ranking'
import { batchCheckSubjectMatch } from './filter'

const TARGET_YEAR = '2026'
const HISTORICAL_YEARS = ['2022', '2023', '2024', '2025']

interface UniversityAggregate {
  university: University
  groupCode: string
  groupName: string
  historicalRanks: { year: string; minRank: number; minScore: number }[]
  predictedRank: number | null
  predictedScore: number | null
  subjectMatch: boolean
}

/**
 * 获取年份难度对标结果
 */
export async function getYearDifficultyAnalysis(
  category: ExamCategory
): Promise<YearDifficultyResult[]> {
  await initRankingData()

  const results: YearDifficultyResult[] = []

  for (const year of HISTORICAL_YEARS) {
    const similarity = calculateYearSimilarity(TARGET_YEAR, year, category)
    let label: string
    if (similarity >= 0.85) label = '非常相似'
    else if (similarity >= 0.7) label = '较为相似'
    else if (similarity >= 0.5) label = '有一定差异'
    else label = '差异较大'

    results.push({
      year: parseInt(year),
      similarity: Math.round(similarity * 100) / 100,
      label,
      weight: 0, // 稍后填充
    })
  }

  // 计算权重
  const totalSimilarity = results.reduce((sum, r) => sum + r.similarity, 0)
  for (const r of results) {
    r.weight = totalSimilarity > 0
      ? Math.round((r.similarity / totalSimilarity) * 100) / 100
      : 0.25
  }

  return results
}

/**
 * 主推荐函数
 */
export async function getRecommendations(
  profile: UserProfile
): Promise<{
  recommendations: RecommendationResult[]
  difficultyAnalysis: YearDifficultyResult[]
}> {
  // 1. 加载所有数据
  await initRankingData()
  const [universities, allScores] = await Promise.all([
    loadUniversities(),
    loadUniversityScores(),
  ])

  // 2. 年份难度分析
  const difficultyAnalysis = await getYearDifficultyAnalysis(profile.preferredSubject)

  // 3. 获取难度权重
  const weightMap: Record<string, number> = {}
  for (const d of difficultyAnalysis) {
    weightMap[String(d.year)] = d.weight
  }

  // 4. 筛选出与用户首选科目一致的投档线
  const relevantScores = allScores.filter(
    (s) => s.preferred_subject === profile.preferredSubject
  )

  // 5. 按 (院校, 专业组) 聚合历史数据
  const aggregateMap = new Map<string, UniversityAggregate>()
  const universityMap = new Map(universities.map((u) => [u.id, u]))

  for (const score of relevantScores) {
    const key = `${score.university_id}_${score.group_code}`
    const uni = universityMap.get(score.university_id)
    if (!uni) continue

    if (!aggregateMap.has(key)) {
      aggregateMap.set(key, {
        university: uni,
        groupCode: score.group_code,
        groupName: score.group_name || '',
        historicalRanks: [],
        predictedRank: null,
        predictedScore: null,
        subjectMatch: true,
      })
    }

    aggregateMap.get(key)!.historicalRanks.push({
      year: String(score.year),
      minRank: score.min_rank,
      minScore: score.min_score,
    })
  }

  // 6. 加权预测每个 (院校, 专业组) 的当年排名
  for (const agg of aggregateMap.values()) {
    if (agg.historicalRanks.length === 0) continue

    let weightedSum = 0
    let totalWeight = 0

    for (const hr of agg.historicalRanks) {
      const w = weightMap[hr.year] || 0.25
      weightedSum += hr.minRank * w
      totalWeight += w
    }

    if (totalWeight > 0) {
      agg.predictedRank = Math.round(weightedSum / totalWeight)
      // 将预测排名反查为目标年份的预估分数
      const predictedScore = rankToScore(
        agg.predictedRank,
        TARGET_YEAR,
        profile.preferredSubject
      )
      agg.predictedScore = predictedScore
    }
  }

  // 7. 检查选科匹配
  const subjectCandidates = Array.from(aggregateMap.entries()).map(
    ([, agg]) => ({
      universityId: agg.university.id,
      groupCode: agg.groupCode,
    })
  )
  const subjectResults = await batchCheckSubjectMatch(
    profile.preferredSubject,
    profile.reselectedSubjects,
    subjectCandidates
  )
  for (const [, agg] of aggregateMap.entries()) {
    const matchKey = `${agg.university.id}_${agg.groupCode}`
    agg.subjectMatch = subjectResults[matchKey] ?? true
  }

  // 8. 生成推荐结果
  const recommendations: RecommendationResult[] = []

  for (const [, agg] of aggregateMap.entries()) {
    if (!agg.predictedRank || !agg.subjectMatch) continue

    const rankDiff = agg.predictedRank - profile.rank
    const rankDiffPercent =
      profile.rank > 0
        ? Math.round((rankDiff / profile.rank) * 1000) / 10
        : 0

    // 冲稳保分类
    let category: 'chong' | 'wen' | 'bao'
    let probability: 'high' | 'medium' | 'low' | 'very_low'
    let probabilityLabel: string

    if (rankDiffPercent > 5) {
      // 院校录取排名远高于考生排名 → 冲
      category = 'chong'
      probability = rankDiffPercent > 15 ? 'very_low' : 'low'
      probabilityLabel = rankDiffPercent > 15 ? '希望较小' : '可以冲刺'
    } else if (rankDiffPercent >= -5) {
      // 排名接近 → 稳
      category = 'wen'
      probability = 'medium'
      probabilityLabel = '录取希望较大'
    } else {
      // 考生排名明显高于院校 → 保
      category = 'bao'
      probability = rankDiffPercent < -10 ? 'high' : 'medium'
      probabilityLabel = rankDiffPercent < -10 ? '录取把握很大' : '较为稳妥'
    }

    // 城市偏好过滤
    if (
      profile.cityPreference &&
      profile.cityPreference.length > 0
    ) {
      const cityMatch =
        profile.cityPreference.includes(agg.university.province) ||
        profile.cityPreference.includes(agg.university.city)
      // 有偏好时，非偏好城市降低优先级但不排除
      if (!cityMatch) {
        // 调整类别（降低一档）
        if (category === 'wen') category = 'chong'
        if (category === 'bao') category = 'wen'
      }
    }

    // 层次偏好过滤
    if (
      profile.levelPreference &&
      profile.levelPreference.length > 0
    ) {
      const levelMatch = profile.levelPreference.includes(agg.university.level)
      if (!levelMatch) continue // 排除不在偏好层次的院校
    }

    recommendations.push({
      university: {
        id: agg.university.id,
        name: agg.university.name,
        province: agg.university.province,
        city: agg.university.city,
        level: agg.university.level,
        type: agg.university.type,
      },
      groupCode: agg.groupCode,
      groupName: agg.groupName,
      predictedMinRank: agg.predictedRank,
      predictedMinScore: agg.predictedScore || 0,
      probability,
      probabilityLabel,
      category,
      rankDiff,
      rankDiffPercent,
      majors: [],
    })
  }

  // 9. 排序：冲（按排名降序）→ 稳（按排名降序）→ 保（按排名升序）
  const categoryOrder = { chong: 0, wen: 1, bao: 2 }
  recommendations.sort((a, b) => {
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category]
    if (catDiff !== 0) return catDiff
    // 同类内，冲和稳按预测排名降序（更好的学校在前），保按预测排名升序（更有把握的在前）
    if (a.category === 'bao') {
      return a.predictedMinRank - b.predictedMinRank
    }
    return b.predictedMinRank - a.predictedMinRank
  })

  return { recommendations, difficultyAnalysis }
}

/**
 * 获取特定院校的预测信息
 */
export async function getSchoolPrediction(
  universityId: string,
  groupCode: string,
  category: ExamCategory
): Promise<{
  historicalRanks: { year: string; minRank: number; minScore: number }[]
  predictedRank: number | null
  predictedScore: number | null
} | null> {
  await initRankingData()
  const allScores = await loadUniversityScores()
  const weights = getDifficultyWeights(TARGET_YEAR, HISTORICAL_YEARS, category)

  const relevantScores = allScores.filter(
    (s) =>
      s.university_id === universityId &&
      s.group_code === groupCode &&
      s.preferred_subject === category
  )

  if (relevantScores.length === 0) return null

  const historicalRanks = relevantScores.map((s) => ({
    year: String(s.year),
    minRank: s.min_rank,
    minScore: s.min_score,
  }))

  let weightedSum = 0
  let totalWeight = 0
  for (const s of relevantScores) {
    const w = weights[String(s.year)] || 0.25
    weightedSum += s.min_rank * w
    totalWeight += w
  }

  const predictedRank = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
  const predictedScore = predictedRank
    ? rankToScore(predictedRank, TARGET_YEAR, category)
    : null

  return { historicalRanks, predictedRank, predictedScore }
}
