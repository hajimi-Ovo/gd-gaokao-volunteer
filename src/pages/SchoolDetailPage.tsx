import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Card, Descriptions, Tag, Button, Spin, Empty, Statistic, Row, Col, Divider, Space, Alert } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { loadUniversities, loadUniversityScores } from '@/utils/dataLoader'
import { getSchoolPrediction } from '@/utils/recommendation'
import { useUserStore } from '@/store/userStore'
import TrendChart from '@/components/charts/TrendChart'
import type { University, UniversityScore, ExamCategory } from '@/types'

const { Title, Text } = Typography

const levelLabel: Record<string, string> = {
  '985': '985',
  '211': '211',
  double_first_class: '双一流',
  public_undergraduate: '公办本科',
  private_undergraduate: '民办本科',
}

const levelColor: Record<string, string> = {
  '985': 'magenta',
  '211': 'blue',
  double_first_class: 'purple',
  public_undergraduate: 'default',
  private_undergraduate: 'warning',
}

type GroupPrediction = {
  historicalRanks: { year: string; minRank: number; minScore: number }[]
  predictedRank: number | null
  predictedScore: number | null
  groupMajors: string[]
  bestGroupScore?: number
  worstGroupScore?: number
}

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, yearWeight } = useUserStore()

  const [university, setUniversity] = useState<University | null>(null)
  const [scores, setScores] = useState<UniversityScore[]>([])
  const [predictions, setPredictions] = useState<Map<string, GroupPrediction>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function load() {
      setLoading(true)
      try {
        const [universities, allScores] = await Promise.all([
          loadUniversities(),
          loadUniversityScores(),
        ])
        const uni = universities.find((u) => u.id === id) || null
        setUniversity(uni)

        const uniScores = allScores.filter(
          (s) => s.university_id === id && s.preferred_subject === (profile.preferredSubject || 'physics')
        )
        setScores(uniScores)

        if (!id) return

        // 为每个专业组获取预测
        const groupCodes = [...new Set(uniScores.map((s) => s.group_code))]
        const predMap = new Map<string, GroupPrediction>()
        for (const code of groupCodes) {
          const pred = await getSchoolPrediction(
            id,
            code,
            (profile.preferredSubject || 'physics') as ExamCategory,
            yearWeight.manualWeights,
            yearWeight.mode
          )
          if (pred) {
            predMap.set(code, pred)
          }
        }
        setPredictions(predMap)
      } catch (e) {
        console.error('Failed to load school details:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, profile.preferredSubject, yearWeight])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!university) {
    return (
      <Empty description="未找到该院校信息">
        <Button onClick={() => navigate(-1)}>返回</Button>
      </Empty>
    )
  }

  // 院校各专业组分差
  const predArray = Array.from(predictions.entries()).map(([code, p]) => ({
    groupCode: code,
    ...p,
  }))
  const allScores = predArray
    .filter((p) => p.predictedScore != null)
    .map((p) => p.predictedScore!)
  const bestGroupScore = allScores.length > 0 ? Math.max(...allScores) : undefined
  const worstGroupScore = allScores.length > 0 ? Math.min(...allScores) : undefined
  const groupGap = bestGroupScore && worstGroupScore ? bestGroupScore - worstGroupScore : undefined

  // 获取第一个专业组的预测作为院校总体预测
  const firstPred = predArray.length > 0 ? predArray[0] : null
  const firstGroupScores = scores
    .filter((s) => s.group_code === firstPred?.groupCode)
    .sort((a, b) => a.year - b.year)

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      {/* 院校基本信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={3}>
          {university.name}
          <Tag color={levelColor[university.level]} style={{ marginLeft: 8 }}>
            {levelLabel[university.level] || university.level}
          </Tag>
          {university.province === '广东' && <Tag color="green">🏠 省内</Tag>}
        </Title>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="所在地">{university.province} {university.city}</Descriptions.Item>
          <Descriptions.Item label="类型">{university.type}</Descriptions.Item>
          <Descriptions.Item label="性质">{university.is_public ? '公办' : '民办'}</Descriptions.Item>
          <Descriptions.Item label="标签">
            {university.tags.map((t) => (
              <Tag key={t} style={{ marginBottom: 4 }}>{t}</Tag>
            ))}
          </Descriptions.Item>
        </Descriptions>
        {university.description && <Text>{university.description}</Text>}
      </Card>

      {/* 预测概览 */}
      {firstPred && firstPred.predictedRank && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="2026 预测排名"
                value={firstPred.predictedRank.toLocaleString()}
                suffix="名"
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="2026 预估分数"
                value={firstPred.predictedScore || '-'}
                suffix="分"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="与你的差距"
                value={
                  profile.rank && firstPred.predictedRank
                    ? `${((firstPred.predictedRank - profile.rank) / profile.rank * 100).toFixed(1)}%`
                    : '-'
                }
                valueStyle={{
                  color:
                    profile.rank && firstPred.predictedRank < profile.rank
                      ? '#ff4d4f'
                      : '#52c41a',
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="专业组分差"
                value={groupGap ?? '-'}
                suffix="分"
                valueStyle={{ color: groupGap && groupGap > 15 ? '#ff4d4f' : '#52c41a' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                最高{bestGroupScore} / 最低{worstGroupScore}
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* 专业组分差警告 */}
      {groupGap && groupGap > 10 && (
        <Alert
          type="warning"
          showIcon
          message="⚠️ 该院校各专业组投档线差距较大"
          description={`最高专业组与最低专业组分差达 ${groupGap} 分。院校公布的"最低投档线"通常是该校最冷门专业组的分数线。如果你以接近最低投档线的分数被录取，很可能进入的是较冷门的专业。报考时请注意区分不同专业组的实际录取分数。`}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 历年趋势图 */}
      {firstGroupScores.length > 0 && (
        <Card title="📈 历年录取趋势" style={{ marginBottom: 16 }}>
          <TrendChart
            scores={firstGroupScores}
            userRank={profile.rank || undefined}
            predictedRank={firstPred?.predictedRank || undefined}
          />
        </Card>
      )}

      <Divider />

      {/* 各专业组详情 */}
      <Card title="📊 各专业组历年数据与预测">
        <Row gutter={[16, 16]}>
          {predArray.map((p) => {
            const groupScores = scores
              .filter((s) => s.group_code === p.groupCode)
              .sort((a, b) => a.year - b.year)
            const isHot = p.bestGroupScore && p.predictedScore && p.predictedScore >= (p.bestGroupScore - 3)
            const isCold = p.worstGroupScore && p.predictedScore && p.predictedScore <= (p.worstGroupScore + 3)

            return (
              <Col xs={24} sm={12} key={p.groupCode}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <span>专业组 {p.groupCode}</span>
                      {isHot && <Tag color="red">🔥 热门</Tag>}
                      {isCold && <Tag>❄️ 冷门</Tag>}
                    </Space>
                  }
                >
                  {/* 历年数据 */}
                  <div style={{ marginBottom: 12 }}>
                    {groupScores.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '4px 0',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <Text>{s.year}年</Text>
                        <Space size={12}>
                          <Text strong>{s.min_score}分</Text>
                          <Text type="secondary">{s.min_rank.toLocaleString()}名</Text>
                        </Space>
                      </div>
                    ))}
                    {p.predictedScore && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '4px 0',
                          background: '#f6ffed',
                        }}
                      >
                        <Text strong style={{ color: '#52c41a' }}>2026预测</Text>
                        <Space size={12}>
                          <Text strong style={{ color: '#52c41a' }}>{p.predictedScore}分</Text>
                          <Text style={{ color: '#52c41a' }}>{p.predictedRank?.toLocaleString()}名</Text>
                        </Space>
                      </div>
                    )}
                  </div>

                  {/* 包含专业 */}
                  {p.groupMajors.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>包含专业：</Text>
                      <div style={{ marginTop: 4 }}>
                        <Space size={[4, 4]} wrap>
                          {p.groupMajors.map((m, i) => (
                            <Tag key={i} color="blue" style={{ fontSize: 11 }}>{m}</Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

      <Divider />

      {/* 历年原始数据 */}
      <Card title="📋 历年原始录取数据">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {scores
            .sort((a, b) => a.year - b.year)
            .map((s) => (
              <Card key={s.id} size="small" style={{ minWidth: 160 }}>
                <Statistic title={`${s.year} 年`} value={s.min_score} suffix="分" />
                <Text type="secondary">专业组：{s.group_code}</Text>
                <br />
                <Text type="secondary">排名：{s.min_rank.toLocaleString()}</Text>
                <br />
                <Text type="secondary">录取：{s.enrollment_count} 人</Text>
              </Card>
            ))}
        </div>
      </Card>
    </div>
  )
}
