/** 院校层次 */
export type UniversityLevel =
  | '985'
  | '211'
  | 'double_first_class'    // 双一流
  | 'public_undergraduate'   // 公办本科
  | 'private_undergraduate'  // 民办本科
  | 'vocational_college'     // 高职专科

/** 院校类型 */
export type UniversityType =
  | 'comprehensive'    // 综合类
  | 'engineering'      // 理工类
  | 'normal'           // 师范类
  | 'medical'          // 医药类
  | 'agriculture'      // 农林类
  | 'finance'          // 财经类
  | 'political_law'    // 政法类
  | 'language'         // 语言类
  | 'art_sport'        // 艺术体育类
  | 'ethnic'           // 民族类
  | 'military'         // 军事类

/** 院校信息 */
export interface University {
  id: string
  name: string
  province: string           // 所在省份
  city: string               // 所在城市
  level: UniversityLevel
  type: UniversityType
  is_public: boolean
  website?: string
  logo?: string
  tags: string[]              // 标签，如 ["C9联盟", "华东五校"]
  description?: string
}

/** 专业组 */
export interface MajorGroup {
  id: string
  university_id: string
  group_code: string          // 专业组代码（如 201）
  group_name: string          // 专业组名称
  preferred_subject: 'physics' | 'history' | 'any'  // 首选科目要求
  reselected_subjects: string[]  // 再选科目要求（如 ["化学", "生物"]）
  major_ids: string[]         // 包含的专业ID列表
  enrollment_year: number     // 招生年份
  enrollment_plan: number     // 招生计划数
}

/** 专业信息 */
export interface Major {
  id: string
  code: string                // 专业代码
  name: string                // 专业名称
  category: string            // 专业大类（如 工学、医学）
  subcategory: string         // 专业子类（如 计算机类）
  description?: string
  main_courses?: string[]     // 主要课程
  employment_direction?: string  // 就业方向
  study_duration: number      // 学制（年）
  degree: string              // 授予学位
}

/** 院校历年投档线 */
export interface UniversityScore {
  id: string
  university_id: string
  group_code: string          // 专业组代码
  group_name?: string         // 专业组名称
  year: number
  preferred_subject: 'physics' | 'history'
  min_score: number           // 最低投档分
  min_rank: number            // 最低排名
  avg_score?: number          // 平均分
  max_score?: number          // 最高分
  enrollment_count: number    // 实际录取人数
}

/** 专业历年录取线 */
export interface MajorScore {
  id: string
  major_id: string
  university_id: string
  group_code: string
  year: number
  min_score: number
  min_rank: number
  avg_score?: number
  enrollment_count: number
}
