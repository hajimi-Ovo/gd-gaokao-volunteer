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
  cityPreference?: string[]     // 目标城市
  majorPreference?: string[]    // 目标专业方向
  levelPreference?: string[]    // 院校层次偏好
  tuitionMax?: number           // 最高可接受学费
}

/** 推荐结果 */
export interface RecommendationResult {
  university: {
    id: string
    name: string
    province: string
    city: string
    level: string
    type: string
  }
  groupCode: string
  groupName: string
  predictedMinRank: number      // 预测最低排名
  predictedMinScore: number     // 预测最低分数
  probability: 'high' | 'medium' | 'low' | 'very_low'
  probabilityLabel: string
  category: 'chong' | 'wen' | 'bao'
  rankDiff: number              // 用户排名与预测排名的差值
  rankDiffPercent: number       // 差值百分比
  majors: {
    id: string
    name: string
    predictedMinRank: number
  }[]
}
