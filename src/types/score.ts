/** 考试类别 */
export type ExamCategory = 'physics' | 'history'

/** 批次线 */
export interface BatchLine {
  year: number
  category: ExamCategory
  batch_name: string           // 批次名称
  batch_code: string           // 批次代码
  score: number                // 省控线分数
  rank: number                 // 对应排名（大致）
}

/** 一分一段表条目 */
export interface ScoreRankEntry {
  score: number                // 分数
  count: number                // 本段人数
  cumulative: number           // 累计人数
  rank: number                 // 全省排名
}

/** 年份难度对标结果 */
export interface YearDifficultyResult {
  year: number
  similarity: number           // 与当前年份的相似度 (0-1)
  label: string                // 描述标签，如 "非常相似"、"差异较大"
  weight: number               // 推荐算法中的权重
}

/** 用户输入信息 */
export interface UserProfile {
  totalScore: number
  rank: number
  preferredSubject: ExamCategory
  reselectedSubjects: string[]
  provincePreference?: string[]   // 目标省份/地区偏好
  majorPreference?: string[]      // 目标专业大类（如 ["工学", "医学"]）
  majorSubPreference?: string[]   // 目标专业子类（如 ["计算机类", "临床医学类"]）
  levelPreference?: string[]      // 院校层次偏好
  tuitionMax?: number             // 最高可接受学费
}

/** 年份权重配置（用户手动调节） */
export interface YearWeightConfig {
  mode: 'equal' | 'auto' | 'manual'  // 等权平均 / 难度自动 / 手动调节
  manualWeights: Record<string, number>  // 如 { "2022": 25, "2023": 25, "2024": 25, "2025": 25 }
}

/** 专业组冷热标记 */
export type GroupHotness = 'hot' | 'normal' | 'cold'

/** 推荐结果 */
export interface RecommendationResult {
  university: {
    id: string
    name: string
    province: string
    city: string
    level: string
    type: string
    isGuangdong: boolean         // 是否广东省内院校
  }
  groupCode: string
  groupName: string
  predictedMinRank: number      // 预测最低排名
  predictedMinScore: number     // 预测最低分数
  scoreDiff: number              // 与考生分数的差值（正=冲，负=保）
  probability: 'high' | 'medium' | 'low' | 'very_low'
  probabilityLabel: string
  category: 'chong' | 'wen' | 'bao'
  rankDiff: number              // 用户排名与预测排名的差值
  rankDiffPercent: number       // 差值百分比
  /** 专业组内容详情 */
  groupMajors: string[]          // 该专业组包含的专业名称列表
  groupHotness: GroupHotness    // 专业组冷热程度
  bestGroupScore?: number       // 该院校最高专业组投档分
  worstGroupScore?: number      // 该院校最低专业组投档分
  isCostEffective?: boolean     // 省外高性价比标记
  costEffectiveNote?: string    // 性价比说明
  majors: {
    id: string
    name: string
    predictedMinRank: number
  }[]
}
