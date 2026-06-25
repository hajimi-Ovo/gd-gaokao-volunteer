import type {
  UserProfile,
  University,
  RecommendationResult,
  ExamCategory,
  YearDifficultyResult,
  GroupHotness,
} from '@/types'
import {
  loadUniversities,
  loadUniversityScores,
} from './dataLoader'
import {
  initRankingData,
  calculateYearSimilarity,
  rankToScore,
} from './ranking'
import { batchCheckSubjectMatch } from './filter'

const TARGET_YEAR = '2026'
const SCORE_REF_YEAR = '2025'  // 2026一分一段表尚未公布，用最近年份2025做分数换算
const HISTORICAL_YEARS = ['2022', '2023', '2024', '2025']

/** 推荐分数区间上/下限 */
const SCORE_RANGE_UPPER = 50   // 高于考生分数最大跨度
const SCORE_RANGE_LOWER = 50   // 低于考生分数最大跨度

/**
 * 安全地将排名转换为分数：优先用目标年份，若数据不存在则用参考年份
 */
function safeRankToScore(rank: number, category: ExamCategory): number | null {
  // 优先用目标年份
  let score = rankToScore(rank, TARGET_YEAR, category)
  if (score !== null) return score
  // 回退到最近可用年份
  return rankToScore(rank, SCORE_REF_YEAR, category)
}

/** 冲稳保分数阈值 */
const CHONG_UPPER = 20   // 冲：高于考生 10~20 分
const CHONG_LOWER = 10   // 分界点：高于此值为冲
const WEN_RANGE = 10     // 稳：±10 分（不含上边界）
const BAO_UPPER = 20     // 保：低于考生 10~20 分

interface UniversityAggregate {
  university: University
  groupCode: string
  groupName: string
  historicalRanks: { year: string; minRank: number; minScore: number }[]
  predictedRank: number | null
  predictedScore: number | null
  subjectMatch: boolean
}

// ---- 专业组 → 所含专业映射（模拟数据，后续从数据文件加载） ----
const GROUP_MAJORS_MAP: Record<string, string[]> = {
  'sysu_201': ['工商管理', '经济学', '法学', '新闻传播学', '英语', '公共管理'],
  'sysu_202': ['临床医学', '基础医学', '口腔医学', '药学', '预防医学'],
  'scut_201': ['机械工程', '自动化', '建筑学', '土木工程', '材料科学与工程', '环境工程'],
  'jnu_201': ['新闻学', '经济学', '金融学', '会计学', '国际经济与贸易', '工商管理'],
  'scnu_201': ['汉语言文学', '教育学', '心理学', '英语', '历史学', '数学与应用数学'],
  'sustech_201': ['数学与应用数学', '物理学', '计算机科学与技术', '生物医学工程', '微电子科学与工程'],
  'szu_201': ['计算机科学与技术', '电子信息工程', '金融学', '法学', '建筑学', '临床医学'],
  'gdut_201': ['机械设计制造及其自动化', '自动化', '计算机科学与技术', '信息工程', '化学工程与工艺'],
  'gzhmu_201': ['临床医学', '护理学', '药学', '预防医学', '医学检验技术'],
  'smu_201': ['临床医学', '口腔医学', '中医学', '药学', '护理学'],
  'fudan_201': ['经济学', '新闻传播学', '法学', '国际政治', '工商管理'],
  'sjtu_201': ['机械工程', '电子信息工程', '船舶与海洋工程', '生物医学工程', '材料科学与工程'],
  'zju_201': ['计算机科学与技术', '光学工程', '控制科学', '临床医学', '农业工程'],
  'hust_201': ['机械工程', '光学工程', '生物医学工程', '电气工程', '计算机科学与技术'],
  'whu_201': ['测绘工程', '遥感科学与技术', '法学', '水利工程', '新闻传播学'],
  'xmu_201': ['会计学', '海洋科学', '化学', '经济学', '统计学'],
  'uestc_201': ['电子信息工程', '通信工程', '计算机科学与技术', '微电子科学与工程', '网络空间安全'],
  'cqu_201': ['建筑学', '土木工程', '机械工程', '电气工程', '环境工程'],
  'gdufs_201': ['英语', '法语', '日语', '国际经济与贸易', '商务英语'],
  'gzu_201': ['土木工程', '建筑学', '教育学', '数学与应用数学', '环境科学'],
  'stu_201': ['临床医学', '法学', '工商管理', '英语', '计算机科学与技术'],
  'scau_201': ['农学', '植物保护', '动物科学', '食品科学与工程', '园艺'],
  'gdmu_201': ['临床医学', '护理学', '药学', '医学检验技术', '麻醉学'],
  'dgut_201': ['计算机科学与技术', '机械工程', '电子信息工程', '自动化', '环境工程'],
}

/** 获取院校内各专业组的分数分布（用于标注冷热） */
function analyzeGroupHotness(
  uniAggs: UniversityAggregate[]
): Map<string, { hotness: GroupHotness; bestScore: number; worstScore: number }> {
  const uniGroups = new Map<string, UniversityAggregate[]>()
  for (const agg of uniAggs) {
    const groups = uniGroups.get(agg.university.id) || []
    groups.push(agg)
    uniGroups.set(agg.university.id, groups)
  }

  const result = new Map<string, { hotness: GroupHotness; bestScore: number; worstScore: number }>()

  for (const [uniId, groups] of uniGroups) {
    const scoresWithKeys = groups
      .filter((g) => g.predictedScore != null)
      .map((g) => ({ key: `${uniId}_${g.groupCode}`, score: g.predictedScore! }))
      .sort((a, b) => b.score - a.score)

    if (scoresWithKeys.length === 0) continue

    const bestScore = scoresWithKeys[0].score
    const worstScore = scoresWithKeys[scoresWithKeys.length - 1].score
    const range = bestScore - worstScore

    for (let i = 0; i < scoresWithKeys.length; i++) {
      const { key, score } = scoresWithKeys[i]

      let hotness: GroupHotness = 'normal'
      if (scoresWithKeys.length >= 2) {
        // 分数在前30%为热门，后30%为冷门
        const percentile = i / (scoresWithKeys.length - 1)
        if (percentile <= 0.3 || (range > 0 && bestScore - score < range * 0.15)) {
          hotness = 'hot'
        } else if (percentile >= 0.7 || (range > 0 && score - worstScore < range * 0.15)) {
          hotness = 'cold'
        }
      }

      result.set(key, { hotness, bestScore, worstScore })
    }
  }

  return result
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
      weight: 0,
    })
  }

  const totalSimilarity = results.reduce((sum, r) => sum + r.similarity, 0)
  for (const r of results) {
    r.weight = totalSimilarity > 0
      ? Math.round((r.similarity / totalSimilarity) * 100) / 100
      : 0.25
  }

  return results
}

/**
 * 获取用户自定义或自动计算的年份权重
 */
function getYearWeights(
  difficultyAnalysis: YearDifficultyResult[],
  manualWeights?: Record<string, number>,
  weightMode?: 'equal' | 'auto' | 'manual'
): Record<string, number> {
  if (weightMode === 'manual' && manualWeights) {
    // 手动模式：直接使用用户设置的权重（归一化）
    const total = Object.values(manualWeights).reduce((a, b) => a + b, 0)
    const normalized: Record<string, number> = {}
    for (const [year, w] of Object.entries(manualWeights)) {
      normalized[year] = total > 0 ? w / total : 0.25
    }
    return normalized
  }

  if (weightMode === 'equal') {
    const equalWeight = 1 / HISTORICAL_YEARS.length
    const weights: Record<string, number> = {}
    for (const year of HISTORICAL_YEARS) {
      weights[year] = equalWeight
    }
    return weights
  }

  // auto 模式：基于难度对标
  const weights: Record<string, number> = {}
  for (const d of difficultyAnalysis) {
    weights[String(d.year)] = d.weight
  }
  return weights
}

/**
 * 检查专业方向匹配
 */
function checkMajorDirectionMatch(
  userMajorPreference: string[] | undefined,
  userMajorSubPreference: string[] | undefined,
  groupMajors: string[]
): boolean {
  // 如果用户没有选择专业方向，全部通过
  if (
    (!userMajorPreference || userMajorPreference.length === 0) &&
    (!userMajorSubPreference || userMajorSubPreference.length === 0)
  ) {
    return true
  }

  // 检查专业组包含的专业是否匹配用户偏好
  // 这里做简单的关键词匹配
  const allKeywords = [...(userMajorPreference || []), ...(userMajorSubPreference || [])]
  if (allKeywords.length === 0) return true

  for (const major of groupMajors) {
    for (const kw of allKeywords) {
      if (major.includes(kw)) return true
    }
  }

  return false
}

/**
 * 省外高性价比检测
 */
function checkCostEffective(
  university: University,
  predictedScore: number,
  userScore: number
): { isCostEffective: boolean; note: string } {
  // 省外211/985院校 + 投档线在用户分数±15分内
  if (university.province === '广东') {
    return { isCostEffective: false, note: '' }
  }

  if (university.level === '985' && predictedScore <= userScore + 10 && predictedScore >= userScore - 20) {
    return {
      isCostEffective: true,
      note: `省外985院校，在广东投档线仅${predictedScore}分，同类省内院校需更高分`,
    }
  }

  if (university.level === '211' && predictedScore <= userScore + 5 && predictedScore >= userScore - 15) {
    return {
      isCostEffective: true,
      note: `省外211强校，性价比高，投档线${predictedScore}分`,
    }
  }

  return { isCostEffective: false, note: '' }
}

/**
 * 主推荐函数
 */
export async function getRecommendations(
  profile: UserProfile,
  manualWeights?: Record<string, number>,
  weightMode?: 'equal' | 'auto' | 'manual'
): Promise<{
  recommendations: RecommendationResult[]
  difficultyAnalysis: YearDifficultyResult[]
}> {
  const userScore = profile.totalScore
  const userRank = profile.rank

  // 1. 加载所有数据
  await initRankingData()
  const [universities, allScores] = await Promise.all([
    loadUniversities(),
    loadUniversityScores(),
  ])

  // 2. 年份难度分析
  const difficultyAnalysis = await getYearDifficultyAnalysis(profile.preferredSubject)

  // 3. 获取年份权重（支持手动/自动/等权）
  const weightMap = getYearWeights(difficultyAnalysis, manualWeights, weightMode)

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
      agg.predictedScore = safeRankToScore(agg.predictedRank, profile.preferredSubject)
    }
  }

  // 7. 检查选科匹配
  const allAggs = Array.from(aggregateMap.values())
  const subjectCandidates = allAggs.map((agg) => ({
    universityId: agg.university.id,
    groupCode: agg.groupCode,
  }))
  const subjectResults = await batchCheckSubjectMatch(
    profile.preferredSubject,
    profile.reselectedSubjects,
    subjectCandidates
  )
  for (const agg of allAggs) {
    const matchKey = `${agg.university.id}_${agg.groupCode}`
    agg.subjectMatch = subjectResults[matchKey] ?? true
  }

  // 8. 计算各院校专业组冷热度
  const hotnessMap = analyzeGroupHotness(allAggs)

  // 9. 生成推荐结果
  const recommendations: RecommendationResult[] = []

  for (const agg of allAggs) {
    if (!agg.predictedRank || !agg.predictedScore || !agg.subjectMatch) continue

    const scoreDiff = agg.predictedScore - userScore
    const rankDiff = agg.predictedRank - userRank
    const rankDiffPercent =
      userRank > 0
        ? Math.round((rankDiff / userRank) * 1000) / 10
        : 0

    // ⭐ ±50分范围过滤
    if (scoreDiff > SCORE_RANGE_UPPER) continue   // 太高了，考不上
    if (scoreDiff < -SCORE_RANGE_LOWER) continue  // 太低了，浪费分数

    // ⭐ 冲稳保分类（基于分数差值，与计划大纲一致）
    let category: 'chong' | 'wen' | 'bao'
    let probability: 'high' | 'medium' | 'low' | 'very_low'
    let probabilityLabel: string

    if (scoreDiff > CHONG_LOWER && scoreDiff <= CHONG_UPPER) {
      // 院校投档线比考生分数高 11~20 分 → 冲
      category = 'chong'
      probability = scoreDiff > 15 ? 'very_low' : 'low'
      probabilityLabel = scoreDiff > 15 ? '希望较小，需超常发挥' : '可以冲刺，有希望'
    } else if (scoreDiff >= -WEN_RANGE && scoreDiff <= CHONG_LOWER) {
      // 院校投档线与考生分数相差 -10~10 分 → 稳（含边界）
      category = 'wen'
      probability = 'medium'
      probabilityLabel = scoreDiff <= 0 ? '录取希望较大' : '正常发挥有望录取'
    } else if (scoreDiff >= -BAO_UPPER && scoreDiff < -WEN_RANGE) {
      // 院校投档线比考生分数低 11~20 分 → 保
      category = 'bao'
      probability = 'high'
      probabilityLabel = scoreDiff < -15 ? '录取把握极大，完全兜底' : '较为稳妥，录取把握大'
    } else if (scoreDiff < -BAO_UPPER) {
      // 低于 20 分以外但仍然在 50 分以内的 → 超级保底
      category = 'bao'
      probability = 'high'
      probabilityLabel = '完全稳妥，可作为保底'
    } else if (scoreDiff > CHONG_UPPER) {
      // 高于 20 分但在 50 分以内的 → 超冲（机会渺茫）
      category = 'chong'
      probability = 'very_low'
      probabilityLabel = '难度较大，仅作参考'
    } else {
      // 其他情况默认稳
      category = 'wen'
      probability = 'medium'
      probabilityLabel = '有一定录取希望'
    }

    // ⭐ 省份偏好过滤（替换原城市偏好）
    if (profile.provincePreference && profile.provincePreference.length > 0) {
      const provinceMatch =
        profile.provincePreference.includes(agg.university.province)
      // 有省份偏好时，非目标省份降低优先级但不排除
      if (!provinceMatch) {
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
      if (!levelMatch) continue
    }

    // 专业方向匹配检查
    const groupKey = `${agg.university.id}_${agg.groupCode}`
    const groupMajors = GROUP_MAJORS_MAP[groupKey] || []
    const majorDirectionMatch = checkMajorDirectionMatch(
      profile.majorPreference,
      profile.majorSubPreference,
      groupMajors
    )

    // 如果用户选了专业方向但不匹配，降低该推荐的优先级
    if (
      (profile.majorPreference && profile.majorPreference.length > 0) ||
      (profile.majorSubPreference && profile.majorSubPreference.length > 0)
    ) {
      if (!majorDirectionMatch) {
        // 不匹配用户专业方向的，降级展示
        if (category === 'wen') category = 'chong'
        if (category === 'bao') category = 'wen'
      }
    }

    // 专业组冷热度
    const hotnessInfo = hotnessMap.get(groupKey)
    const groupHotness: GroupHotness = hotnessInfo?.hotness || 'normal'

    // 省外高性价比检测
    const costEffective = checkCostEffective(agg.university, agg.predictedScore, userScore)

    recommendations.push({
      university: {
        id: agg.university.id,
        name: agg.university.name,
        province: agg.university.province,
        city: agg.university.city,
        level: agg.university.level,
        type: agg.university.type,
        isGuangdong: agg.university.province === '广东',
      },
      groupCode: agg.groupCode,
      groupName: agg.groupName,
      predictedMinRank: agg.predictedRank,
      predictedMinScore: agg.predictedScore,
      scoreDiff,
      probability,
      probabilityLabel,
      category,
      rankDiff,
      rankDiffPercent,
      groupMajors,
      groupHotness,
      bestGroupScore: hotnessInfo?.bestScore,
      worstGroupScore: hotnessInfo?.worstScore,
      isCostEffective: costEffective.isCostEffective,
      costEffectiveNote: costEffective.note,
      majors: [],
    })
  }

  // 10. 排序：优先展示专业匹配 + 省外高性价比的
  recommendations.sort((a, b) => {
    const categoryOrder = { chong: 0, wen: 1, bao: 2 }
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category]
    if (catDiff !== 0) return catDiff

    // 同类别内：高性价比优先
    if (a.isCostEffective && !b.isCostEffective) return -1
    if (!a.isCostEffective && b.isCostEffective) return 1

    // 冲和稳按预测分数降序（更好的学校在前），保按预测分数升序（更有把握的在前）
    if (a.category === 'bao') {
      return a.predictedMinRank - b.predictedMinRank
    }
    return b.predictedMinRank - a.predictedMinRank
  })

  return { recommendations, difficultyAnalysis }
}

/**
 * 获取特定院校专业组的完整预测信息（用于志愿详情弹窗）
 */
export async function getSchoolPrediction(
  universityId: string,
  groupCode: string,
  category: ExamCategory,
  manualWeights?: Record<string, number>,
  weightMode?: 'equal' | 'auto' | 'manual'
): Promise<{
  historicalRanks: { year: string; minRank: number; minScore: number }[]
  predictedRank: number | null
  predictedScore: number | null
  groupMajors: string[]
  bestGroupScore?: number
  worstGroupScore?: number
} | null> {
  await initRankingData()
  const allScores = await loadUniversityScores()

  const relevantScores = allScores.filter(
    (s) =>
      s.university_id === universityId &&
      s.preferred_subject === category
  )

  if (relevantScores.length === 0) return null

  // 获取该院校所有专业组的分数分布
  const allGroupScores = new Map<string, { minScore: number; minRank: number }[]>()
  for (const s of relevantScores) {
    if (!allGroupScores.has(s.group_code)) {
      allGroupScores.set(s.group_code, [])
    }
    allGroupScores.get(s.group_code)!.push({
      minScore: s.min_score,
      minRank: s.min_rank,
    })
  }

  // 该专业组的历史数据
  const targetGroupScores = relevantScores.filter((s) => s.group_code === groupCode)
  const historicalRanks = targetGroupScores.map((s) => ({
    year: String(s.year),
    minRank: s.min_rank,
    minScore: s.min_score,
  }))

  // 加权预测
  const diffAnalysis = HISTORICAL_YEARS.map((y) => ({
    year: y,
    similarity: calculateYearSimilarity(TARGET_YEAR, y, category),
  }))
  const totalSim = diffAnalysis.reduce((s, d) => s + d.similarity, 0)
  const weights: Record<string, number> = {}

  if (weightMode === 'manual' && manualWeights) {
    const total = Object.values(manualWeights).reduce((a, b) => a + b, 0)
    for (const [year, w] of Object.entries(manualWeights)) {
      weights[year] = total > 0 ? w / total : 0.25
    }
  } else if (weightMode === 'equal') {
    for (const y of HISTORICAL_YEARS) weights[y] = 0.25
  } else {
    for (const d of diffAnalysis) {
      weights[d.year] = totalSim > 0 ? d.similarity / totalSim : 0.25
    }
  }

  let weightedSum = 0
  let totalWeight = 0
  for (const s of targetGroupScores) {
    const w = weights[String(s.year)] || 0.25
    weightedSum += s.min_rank * w
    totalWeight += w
  }

  const predictedRank = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
  const predictedScore = predictedRank
    ? safeRankToScore(predictedRank, category)
    : null

  // 计算该院校各专业组的平均分数，找出最高/最低
  let bestGroupScore: number | undefined
  let worstGroupScore: number | undefined
  for (const [, scores] of allGroupScores) {
    const avgScore = scores.reduce((sum, s) => sum + s.minScore, 0) / scores.length
    if (bestGroupScore === undefined || avgScore > bestGroupScore) bestGroupScore = Math.round(avgScore)
    if (worstGroupScore === undefined || avgScore < worstGroupScore) worstGroupScore = Math.round(avgScore)
  }

  const groupKey = `${universityId}_${groupCode}`
  const groupMajors = GROUP_MAJORS_MAP[groupKey] || []

  return {
    historicalRanks,
    predictedRank,
    predictedScore,
    groupMajors,
    bestGroupScore,
    worstGroupScore,
  }
}
