import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Card, Descriptions, Tag, Button, Spin, Empty, Statistic, Row, Col, Divider } from 'antd'
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

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useUserStore()

  const [university, setUniversity] = useState<University | null>(null)
  const [scores, setScores] = useState<UniversityScore[]>([])
  const [prediction, setPrediction] = useState<{
    historicalRanks: { year: string; minRank: number; minScore: number }[]
    predictedRank: number | null
    predictedScore: number | null
  } | null>(null)
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

        // 获取预测
        if (uniScores.length > 0 && id) {
          const groupCode = uniScores[0].group_code
          const pred = await getSchoolPrediction(id, groupCode, (profile.preferredSubject || 'physics') as ExamCategory)
          setPrediction(pred)
        }
      } catch (e) {
        console.error('Failed to load school details:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, profile.preferredSubject])

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

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <Title level={3}>
          {university.name}
          <Tag color="blue" style={{ marginLeft: 8 }}>{levelLabel[university.level] || university.level}</Tag>
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

      {/* 预测信息 */}
      {prediction && prediction.predictedRank && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="2026 预测排名"
                value={prediction.predictedRank.toLocaleString()}
                suffix="名"
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="2026 预估分数"
                value={prediction.predictedScore || '-'}
                suffix="分"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="与你的排名差距"
                value={
                  profile.rank
                    ? ((prediction.predictedRank - profile.rank) / profile.rank * 100).toFixed(1) + '%'
                    : '-'
                }
                valueStyle={{
                  color:
                    profile.rank && prediction.predictedRank < profile.rank
                      ? '#ff4d4f'
                      : '#52c41a',
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 历年趋势图 */}
      <Card title="📈 历年录取趋势">
        <TrendChart
          scores={scores}
          userRank={profile.rank || undefined}
          predictedRank={prediction?.predictedRank || undefined}
        />
      </Card>

      <Divider />

      {/* 历年数据表 */}
      <Card title="📊 历年录取数据">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {scores
            .sort((a, b) => a.year - b.year)
            .map((s) => (
              <Card key={s.id} size="small" style={{ minWidth: 160 }}>
                <Statistic title={`${s.year} 年`} value={s.min_score} suffix="分" />
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
