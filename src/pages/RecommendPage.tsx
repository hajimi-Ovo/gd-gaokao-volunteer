import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Card,
  Button,
  Space,
  Empty,
  Descriptions,
  Statistic,
  Row,
  Col,
  Collapse,
  Progress,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useUserStore } from '@/store/userStore'
import { useRecommendation } from '@/hooks/useRecommendation'
import RecommendTable from '@/components/recommend/RecommendTable'

const { Title, Text } = Typography

export default function RecommendPage() {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const { loading, error, recommendations, difficultyAnalysis, refresh } = useRecommendation()

  if (!profile.totalScore || !profile.rank) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Empty description="请先填写高考信息">
            <Button type="primary" onClick={() => navigate('/input')}>
              前往填写
            </Button>
          </Empty>
        </Card>
      </div>
    )
  }

  const chongCount = recommendations.filter((r) => r.category === 'chong').length
  const wenCount = recommendations.filter((r) => r.category === 'wen').length
  const baoCount = recommendations.filter((r) => r.category === 'bao').length

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/input')}>
          返回修改
        </Button>
        <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
          刷新推荐
        </Button>
      </Space>

      {/* 用户信息卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>📊 你的信息</Title>
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="small">
          <Descriptions.Item label="总分">
            <Text strong style={{ fontSize: 16 }}>{profile.totalScore}</Text> 分
          </Descriptions.Item>
          <Descriptions.Item label="全省排名">
            <Text strong style={{ fontSize: 16 }}>{profile.rank.toLocaleString()}</Text> 名
          </Descriptions.Item>
          <Descriptions.Item label="首选科目">
            {profile.preferredSubject === 'physics' ? '物理类' : '历史类'}
          </Descriptions.Item>
          <Descriptions.Item label="再选科目">
            {profile.reselectedSubjects.join('、') || '未选择'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 年份难度对标 */}
      {difficultyAnalysis.length > 0 && (
        <Collapse
          style={{ marginBottom: 16 }}
          size="small"
          items={[
            {
              key: 'difficulty',
              label: '📈 年份难度对标分析',
              children: (
                <Row gutter={[16, 16]}>
                  {difficultyAnalysis.map((d) => (
                    <Col xs={24} sm={12} md={6} key={d.year}>
                      <Card size="small">
                        <Statistic
                          title={`${d.year} 年`}
                          value={`${(d.similarity * 100).toFixed(0)}%`}
                          suffix="相似"
                          valueStyle={{ fontSize: 24 }}
                        />
                        <Text type="secondary">{d.label}</Text>
                        <Progress
                          percent={Math.round(d.similarity * 100)}
                          size="small"
                          strokeColor={
                            d.similarity >= 0.8
                              ? '#52c41a'
                              : d.similarity >= 0.6
                              ? '#faad14'
                              : '#ff4d4f'
                          }
                          style={{ marginTop: 4 }}
                        />
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            推荐权重：{((d.weight || 0) * 100).toFixed(0)}%
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      )}

      {/* 推荐统计概览 */}
      {!loading && recommendations.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: '4px solid #ff4d4f' }}>
              <Statistic title="🔴 冲刺推荐" value={chongCount} suffix="所" />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: '4px solid #faad14' }}>
              <Statistic title="🟡 稳妥推荐" value={wenCount} suffix="所" />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
              <Statistic title="🟢 保底推荐" value={baoCount} suffix="所" />
            </Card>
          </Col>
        </Row>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert
          message="推荐计算出错"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={refresh}>
              重试
            </Button>
          }
        />
      )}

      {/* 推荐结果表格 */}
      <Card title="🎯 智能推荐结果">
        <RecommendTable data={recommendations} loading={loading} />
      </Card>
    </div>
  )
}
