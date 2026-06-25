/** 志愿条目 */
export interface VolunteerItem {
  id: string
  universityId: string
  universityName: string
  groupCode: string
  groupName: string
  category: 'chong' | 'wen' | 'bao'
  order: number                // 志愿序号 (1-45)
  predictedRank: number
  probability: string
  note?: string
}

/** 志愿方案 */
export interface VolunteerPlan {
  id: string
  name: string
  createTime: string
  updateTime: string
  userProfile: {
    totalScore: number
    rank: number
    preferredSubject: string
    reselectedSubjects: string[]
  }
  items: VolunteerItem[]
}

/** 志愿合理性检查结果 */
export interface VolunteerCheckResult {
  passed: boolean
  warnings: string[]
  suggestions: string[]
  score: number                // 合理性评分 0-100
}
