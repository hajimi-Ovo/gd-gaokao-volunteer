import { loadSubjectRequirements } from './dataLoader'

/**
 * 检查考生选科是否匹配院校专业组要求
 *
 * @param userPreferred 考生首选科目 (physics/history)
 * @param userReselected 考生再选科目 (如 ["化学", "生物"])
 * @param universityId 院校ID
 * @param groupCode 专业组代码
 * @returns true=匹配, false=不匹配
 */
export async function checkSubjectMatch(
  userPreferred: string,
  userReselected: string[],
  universityId: string,
  groupCode: string
): Promise<boolean> {
  const requirements = await loadSubjectRequirements()
  const key = `${universityId}_${groupCode}`
  const req = requirements[key]

  // 如果没有记录选科要求，默认通过（容错处理）
  if (!req) return true

  // 检查首选科目
  if (req.preferred_subject !== 'any' && req.preferred_subject !== userPreferred) {
    return false
  }

  // 检查再选科目要求
  if (req.reselected_subjects.length > 0) {
    // 专业组要求的每门再选科目，考生都必须选考
    for (const required of req.reselected_subjects) {
      if (!userReselected.includes(required)) {
        return false
      }
    }
  }

  return true
}

/**
 * 批量检查选科匹配
 */
export async function batchCheckSubjectMatch(
  userPreferred: string,
  userReselected: string[],
  candidates: Array<{ universityId: string; groupCode: string }>
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}
  for (const c of candidates) {
    const key = `${c.universityId}_${c.groupCode}`
    results[key] = await checkSubjectMatch(
      userPreferred,
      userReselected,
      c.universityId,
      c.groupCode
    )
  }
  return results
}
