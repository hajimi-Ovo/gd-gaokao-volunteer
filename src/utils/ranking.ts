import type { ScoreRankEntry, ExamCategory } from '@/types'
import { loadScoreRanking } from './dataLoader'

/**
 * 根据排名估算分数（反查一分一段表）
 */
export function rankToScore(
  rank: number,
  year: string,
  category: ExamCategory
): number | null {
  const rankings = getRankingData()
  if (!rankings || !rankings[year] || !rankings[year][category]) return null

  const entries = rankings[year][category]
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].cumulative >= rank) {
      // 线性插值
      if (i === 0) return entries[i].score
      const prev = entries[i - 1]
      const curr = entries[i]
      const ratio = (rank - prev.cumulative) / (curr.cumulative - prev.cumulative)
      return Math.round(prev.score - (prev.score - curr.score) * ratio)
    }
  }
  return entries[entries.length - 1].score
}

/**
 * 根据分数估算排名（查一分一段表）
 */
export function scoreToRank(
  score: number,
  year: string,
  category: ExamCategory
): number | null {
  const rankings = getRankingData()
  if (!rankings || !rankings[year] || !rankings[year][category]) return null

  const entries = rankings[year][category]
  for (const entry of entries) {
    if (entry.score <= score) {
      return entry.cumulative
    }
  }
  return entries[entries.length - 1].cumulative
}

// 内存中的一分一段数据缓存
let rankingData: Record<string, Record<string, ScoreRankEntry[]>> | null = null

function getRankingData() {
  return rankingData
}

export async function initRankingData() {
  rankingData = await loadScoreRanking()
}

/**
 * 计算两个年份的难度相似度
 *
 * 选取关键分数锚点，比较同一分数在不同年份对应的排名，
 * 排名越接近，说明难度越相似。
 */
export function calculateYearSimilarity(
  targetYear: string,
  compareYear: string,
  category: ExamCategory
): number {
  const data = getRankingData()
  if (!data) return 0.5

  const targetData = data[targetYear]?.[category]
  const compareData = data[compareYear]?.[category]
  if (!targetData || !compareData) return 0.5

  // 选取锚点分数（每隔 50 分取一个点）
  const anchorScores = [700, 650, 600, 550, 500, 450, 400]
  const buildRankMap = (entries: ScoreRankEntry[]) => {
    const map = new Map<number, number>()
    for (const score of anchorScores) {
      const entry = entries.find((e) => e.score <= score)
      if (entry) map.set(score, entry.cumulative)
    }
    return map
  }

  const targetMap = buildRankMap(targetData)
  const compareMap = buildRankMap(compareData)

  let totalDeviation = 0
  let count = 0

  for (const score of anchorScores) {
    const tRank = targetMap.get(score)
    const cRank = compareMap.get(score)
    if (tRank && cRank && cRank > 0) {
      totalDeviation += Math.abs(tRank - cRank) / cRank
      count++
    }
  }

  if (count === 0) return 0.5
  const avgDeviation = totalDeviation / count
  return Math.max(0, 1 - avgDeviation * 3)
}

/**
 * 获取各历史年份的难度权重
 */
export function getDifficultyWeights(
  targetYear: string,
  historicalYears: string[],
  category: ExamCategory
): Record<string, number> {
  const weights: Record<string, number> = {}
  let totalWeight = 0

  for (const year of historicalYears) {
    const similarity = calculateYearSimilarity(targetYear, year, category)
    weights[year] = similarity
    totalWeight += similarity
  }

  // 归一化
  if (totalWeight > 0) {
    for (const year of historicalYears) {
      weights[year] = weights[year] / totalWeight
    }
  } else {
    // 如果全部为0，则等权
    const equalWeight = 1 / historicalYears.length
    for (const year of historicalYears) {
      weights[year] = equalWeight
    }
  }

  return weights
}

/**
 * 根据排名跨年份换算等值分数
 * 例如：2026 年排名 25000 ≈ 2022 年多少分？
 */
export function convertRankAcrossYears(
  rank: number,
  fromYear: string,
  toYear: string,
  category: ExamCategory
): number | null {
  const fromScore = rankToScore(rank, fromYear, category)
  if (fromScore === null) return null

  const toRank = scoreToRank(fromScore, toYear, category)
  if (toRank === null) return null

  // 用同一排名在目标年份映射
  return rankToScore(rank, toYear, category)
}
