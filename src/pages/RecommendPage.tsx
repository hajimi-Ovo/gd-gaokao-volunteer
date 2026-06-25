import { useState } from 'react'
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
  Alert,
  Slider,
  Tag,
  Divider,
  Radio,
} from 'antd'
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useUserStore } from '@/store/userStore'
import { useRecommendation } from '@/hooks/useRecommendation'
import RecommendTable from '@/components/recommend/RecommendTable'

const { Title, Text } = Typography

export default function RecommendPage() {
  const navigate = useNavigate()
  const { profile, yearWeight, setYearWeight } = useUserStore()
  const { loading, error, recommendations, refresh } = useRecommendation()

  // 手动权重临时状态
  const [manualWeights, setManualWeights] = useState<Record<string, number>>(
    yearWeight.manualWeights
  )

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

  const scoreUpper = profile.totalScore + 50
  const scoreLower = profile.totalScore - 50

  const handleWeightModeChange = (mode: 'equal' | 'auto' | 'manual') => {
    setYearWeight({ mode, manualWeights: { ...manualWeights } })
  }

  const handleManualWeightChange = (year: string, value: number) => {
    const newWeights = { ...manualWeights, [year]: value }
    setManualWeights(newWeights)
  }

  const handleApplyManualWeights = () => {
    setYearWeight({ mode: 'manual', manualWeights: { ...manualWeights } })
  }

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
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
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
          <Descriptions.Item label="推荐范围" span={2}>
            <Tag color="blue">
              {scoreLower} ~ {scoreUpper} 分（±50分区间）
            </Tag>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              高于{scoreUpper}分的院校基本考不上，低于{scoreLower}分的院校浪费分数
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 年份权重配置面板 */}
      <Collapse
        style={{ marginBottom: 16 }}
        size="small"
        expandIconPosition="end"
        items={[
          {
            key: 'year-weight',
            label: (
              <Space>
                <SettingOutlined />
                <span>年份权重设置</span>
                <Tag color="blue" style={{ fontSize: 11 }}>
                  {yearWeight.mode === 'equal' ? '等权平均' : yearWeight.mode === 'auto' ? '难度自动' : '手动调节'}
                </Tag>
              </Space>
            ),
            children: (
              <div>
                <Radio.Group
                  value={yearWeight.mode}
                  onChange={(e) => handleWeightModeChange(e.target.value)}
                  style={{ marginBottom: 12 }}
                  size="small"
                >
                  <Radio.Button value="equal">等权平均（各25%）</Radio.Button>
                  <Radio.Button value="auto">难度自动加权</Radio.Button>
                  <Radio.Button value="manual">手动调节</Radio.Button>
                </Radio.Group>

                <Row gutter={[16, 8]}>
                  {['2022', '2023', '2024', '2025'].map((year) => (
                    <Col xs={24} sm={12} key={year}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Text strong style={{ minWidth: 50 }}>{year}年</Text>
                        <Slider
                          style={{ flex: 1 }}
                          min={0}
                          max={100}
                          step={5}
                          value={manualWeights[year] || 25}
                          onChange={(val) => handleManualWeightChange(year, val)}
                          disabled={yearWeight.mode !== 'manual'}
                        />
                        <Text style={{ minWidth: 40, textAlign: 'right' }}>
                          {manualWeights[year] || 25}%
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>

                {yearWeight.mode === 'manual' && (
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      总权重：{Object.values(manualWeights).reduce((a, b) => a + b, 0)}%
                      {Object.values(manualWeights).reduce((a, b) => a + b, 0) !== 100 && (
                        <Text type="danger" style={{ marginLeft: 8 }}>（建议调整为100%）</Text>
                      )}
                    </Text>
                    <Button
                      type="primary"
                      size="small"
                      style={{ marginLeft: 12 }}
                      onClick={handleApplyManualWeights}
                    >
                      应用并重新计算
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* 推荐统计概览 */}
      {!loading && recommendations.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: '4px solid #ff4d4f' }}>
              <Statistic
                title="🔴 冲刺推荐"
                value={chongCount}
                suffix="条"
                valueStyle={{ color: '#ff4d4f' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                高于你 {profile.totalScore + 10}~{profile.totalScore + 20} 分
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: '4px solid #faad14' }}>
              <Statistic
                title="🟡 稳妥推荐"
                value={wenCount}
                suffix="条"
                valueStyle={{ color: '#faad14' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                与你分数接近（±10分）
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
              <Statistic
                title="🟢 保底推荐"
                value={baoCount}
                suffix="条"
                valueStyle={{ color: '#52c41a' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                低于你 {profile.totalScore - 20}~{profile.totalScore - 10} 分
              </Text>
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
      <Card
        title={
          <Space>
            <span>🎯 智能推荐结果</span>
            <Tag color="blue">±50分区间</Tag>
            <Tag color="green">
              {profile.preferredSubject === 'physics' ? '物理类' : '历史类'}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              冲：+10~20分 | 稳：±10分 | 保：-10~-20分
            </Text>
          </Space>
        }
      >
        <RecommendTable data={recommendations} loading={loading} />
      </Card>

      <Divider />

      {/* 底部数据说明 */}
      <Alert
        message="⚠️ 免责声明"
        description="以上推荐结果基于历史数据的加权预测，仅供参考。实际录取受招生计划、报考人数、政策变化等多重因素影响。最终志愿选择请结合自身情况和官方最新信息综合判断。"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
    </div>
  )
}
