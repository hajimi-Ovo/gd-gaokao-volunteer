import { useState, useEffect } from 'react'
import { Typography, Card, Select, Space, Empty, Table } from 'antd'
import { loadUniversities, loadUniversityScores } from '@/utils/dataLoader'
import { loadScoreRanking } from '@/utils/dataLoader'
import { calculateYearSimilarity } from '@/utils/ranking'
import DifficultyCompare from '@/components/charts/DifficultyCompare'
import { useUserStore } from '@/store/userStore'
import type { University, UniversityScore, YearDifficultyResult, ExamCategory, ScoreRankEntry } from '@/types'

const { Title, Text } = Typography

export default function ComparePage() {
  const { profile } = useUserStore()
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [scores, setScores] = useState<UniversityScore[]>([])
  const [rankingData, setRankingData] = useState<Record<string, ScoreRankEntry[]>>({})

  // 年份难度对标
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<YearDifficultyResult[]>([])

  useEffect(() => {
    async function load() {
      const [unis, scrs, rkData] = await Promise.all([
        loadUniversities(),
        loadUniversityScores(),
        loadScoreRanking(),
      ])
      setUniversities(unis)
      setScores(scrs)
      const category = profile.preferredSubject || 'physics'
      setRankingData(rkData[category]
        ? Object.fromEntries(
            Object.entries(rkData).map(([year, catData]) => [
              year,
              (catData as Record<string, ScoreRankEntry[]>)[category] || [],
            ])
          )
        : {})

      // 计算难度对标
      const analysis: YearDifficultyResult[] = []
      const years = ['2022', '2023', '2024', '2025']
      for (const year of years) {
        const similarity = calculateYearSimilarity('2026', year, category as ExamCategory)
        analysis.push({
          year: parseInt(year),
          similarity: Math.round(similarity * 100) / 100,
          label:
            similarity >= 0.85 ? '非常相似' : similarity >= 0.7 ? '较为相似' : similarity >= 0.5 ? '有一定差异' : '差异较大',
          weight: 0,
        })
      }
      const total = analysis.reduce((s, a) => s + a.similarity, 0)
      analysis.forEach((a) => (a.weight = total > 0 ? Math.round((a.similarity / total) * 100) / 100 : 0.25))
      setDifficultyAnalysis(analysis)
    }
    load()
  }, [profile.preferredSubject])

  const selectedScores = scores.filter(
    (s) =>
      selectedIds.includes(s.university_id) &&
      s.preferred_subject === (profile.preferredSubject || 'physics')
  )

  const uniOptions = universities.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.province}${u.city})`,
  }))

  return (
    <div>
      <Title level={4}>📊 对比分析</Title>

      {/* 年份难度对标 */}
      <Card title="📈 年份难度分布对比（一分一段曲线）" style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          同一分数在不同年份对应的排名不同。曲线越接近，说明难度越相似。
          <strong style={{ color: '#ff4d4f' }}>红色为2026年</strong>，
          <strong style={{ color: '#52c41a' }}>绿色为难度相似年份</strong>。
        </Text>
        {Object.keys(rankingData).length > 0 ? (
          <DifficultyCompare
            rankingData={rankingData}
            targetYear="2026"
            difficultyAnalysis={difficultyAnalysis}
          />
        ) : (
          <Empty description="数据加载中..." />
        )}
      </Card>

      {/* 院校选择对比 */}
      <Card title="🏫 院校选择对比" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            mode="multiple"
            placeholder="选择要对比的院校（最多 5 所）"
            style={{ width: '100%' }}
            maxCount={5}
            value={selectedIds}
            onChange={setSelectedIds}
            options={uniOptions}
            size="large"
          />
        </Space>
      </Card>

      {/* 对比表格 */}
      {selectedIds.length > 0 && (
        <Card title="📋 对比结果">
          <Table
            dataSource={selectedIds.map((id) => {
              const uni = universities.find((u) => u.id === id)
              const uniScores = selectedScores.filter((s) => s.university_id === id)
              const latest = uniScores.find((s) => s.year === 2025) || uniScores[0]
              const avgRank =
                uniScores.length > 0
                  ? Math.round(uniScores.reduce((s, sc) => s + sc.min_rank, 0) / uniScores.length)
                  : 0
              return {
                key: id,
                name: uni?.name || id,
                level: uni?.level || '-',
                city: uni ? `${uni.province}${uni.city}` : '-',
                latestScore: latest?.min_score || '-',
                latestRank: latest?.min_rank || 0,
                avgRank,
              }
            })}
            columns={[
              { title: '院校', dataIndex: 'name', key: 'name', width: 180 },
              { title: '层次', dataIndex: 'level', key: 'level', width: 100 },
              { title: '所在地', dataIndex: 'city', key: 'city', width: 120 },
              {
                title: '2025年分数',
                dataIndex: 'latestScore',
                key: 'latestScore',
                width: 110,
                render: (v: string | number) => (v ? `${v} 分` : '-'),
              },
              {
                title: '2025年排名',
                dataIndex: 'latestRank',
                key: 'latestRank',
                width: 130,
                sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => (a.latestRank as number) - (b.latestRank as number),
                render: (v: number) => (v ? v.toLocaleString() : '-'),
              },
              {
                title: '近4年平均排名',
                dataIndex: 'avgRank',
                key: 'avgRank',
                width: 140,
                sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => (a.avgRank as number) - (b.avgRank as number),
                render: (v: number) => (v ? v.toLocaleString() : '-'),
              },
            ]}
            pagination={false}
            size="middle"
          />
        </Card>
      )}
    </div>
  )
}
