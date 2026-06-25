import { useState, useEffect } from 'react'
import { Modal, Descriptions, Tag, Typography, Spin, Statistic, Row, Col, Alert, Divider, Space, Card } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'
import type { VolunteerItem, ExamCategory } from '@/types'
import { getSchoolPrediction } from '@/utils/recommendation'
import { useUserStore } from '@/store/userStore'

const { Text, Title } = Typography

interface VolunteerDetailProps {
  open: boolean
  item: VolunteerItem | null
  onClose: () => void
}

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

export default function VolunteerDetail({ open, item, onClose }: VolunteerDetailProps) {
  const { profile, yearWeight } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<{
    historicalRanks: { year: string; minRank: number; minScore: number }[]
    predictedRank: number | null
    predictedScore: number | null
    groupMajors: string[]
    bestGroupScore?: number
    worstGroupScore?: number
  } | null>(null)

  useEffect(() => {
    if (open && item) {
      setLoading(true)
      getSchoolPrediction(
        item.universityId,
        item.groupCode,
        (profile.preferredSubject || 'physics') as ExamCategory,
        yearWeight.manualWeights,
        yearWeight.mode
      )
        .then((result) => setDetail(result))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, item?.universityId, item?.groupCode, profile.preferredSubject, yearWeight])

  if (!item) return null

  const sortedHistory = detail?.historicalRanks
    ? [...detail.historicalRanks].sort((a, b) => parseInt(a.year) - parseInt(b.year))
    : []

  return (
    <Modal
      title={
        <Space>
          <span>📋 志愿详情</span>
          <Tag color={levelColor[item.universityLevel]}>
            {levelLabel[item.universityLevel] || item.universityLevel}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div>
          {/* 基本信息 */}
          <Title level={4} style={{ marginBottom: 8 }}>
            {item.universityName}
          </Title>
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="所在地">
              {item.universityProvince} {item.universityCity}
            </Descriptions.Item>
            <Descriptions.Item label="专业组">
              {item.groupName || `专业组 ${item.groupCode}`}
            </Descriptions.Item>
            <Descriptions.Item label="分类">
              {item.category === 'chong' ? '🔴 冲刺' : item.category === 'wen' ? '🟡 稳妥' : '🟢 保底'}
            </Descriptions.Item>
          </Descriptions>

          {/* 分数对比 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="你的分数"
                value={profile.totalScore}
                suffix="分"
                valueStyle={{ color: '#1677ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="预估投档线"
                value={item.predictedScore}
                suffix="分"
                valueStyle={{ color: item.scoreDiff > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="分数差距"
                value={item.scoreDiff > 0 ? `+${item.scoreDiff}` : item.scoreDiff}
                suffix="分"
                prefix={
                  item.scoreDiff > 0
                    ? <ArrowUpOutlined />
                    : item.scoreDiff < 0
                    ? <ArrowDownOutlined />
                    : <MinusOutlined />
                }
                valueStyle={{ color: item.scoreDiff > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Col>
          </Row>

          {/* 历年投档线趋势 */}
          {sortedHistory.length > 0 && (
            <>
              <Divider orientation="left">📈 近五年投档线趋势</Divider>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                {sortedHistory.map((h) => (
                  <Card key={h.year} size="small" style={{ minWidth: 110, flex: 1 }}>
                    <Statistic
                      title={`${h.year}年`}
                      value={h.minScore}
                      suffix="分"
                      valueStyle={{ fontSize: 20 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      排名：{h.minRank.toLocaleString()}
                    </Text>
                  </Card>
                ))}
                {detail?.predictedScore && (
                  <Card size="small" style={{ minWidth: 110, flex: 1, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                    <Statistic
                      title="2026预测"
                      value={detail.predictedScore}
                      suffix="分"
                      valueStyle={{ fontSize: 20, color: '#52c41a' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      排名：{detail.predictedRank?.toLocaleString() || '-'}
                    </Text>
                  </Card>
                )}
              </div>

              {/* 排名稳定性分析 */}
              {sortedHistory.length >= 3 && (() => {
                const ranks = sortedHistory.map(h => h.minRank)
                const avgRank = Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length)
                const maxRank = Math.max(...ranks)
                const minRank = Math.min(...ranks)
                const volatility = maxRank > 0 ? Math.round((maxRank - minRank) / avgRank * 100) : 0
                return (
                  <Alert
                    type={volatility > 20 ? 'warning' : 'info'}
                    message={
                      volatility > 20
                        ? `⚠️ 排名波动较大（${volatility}%），存在"大小年"现象，需谨慎参考`
                        : `✅ 排名相对稳定（波动${volatility}%），预测可信度较高`
                    }
                    style={{ marginBottom: 12 }}
                  />
                )
              })()}
            </>
          )}

          {/* 专业组包含专业 */}
          {detail?.groupMajors && detail.groupMajors.length > 0 && (
            <>
              <Divider orientation="left">📚 该专业组包含专业</Divider>
              <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                {detail.groupMajors.map((major, idx) => (
                  <Tag key={idx} color="blue">{major}</Tag>
                ))}
              </Space>
            </>
          )}

          {/* 院校专业组差距警告 */}
          {detail?.bestGroupScore && detail?.worstGroupScore && (
            <>
              <Divider orientation="left">⚠️ 风险提示</Divider>
              <Alert
                type="warning"
                showIcon
                message="注意院校最低分与专业组分差"
                description={`该校最高专业组投档线约 ${detail.bestGroupScore} 分，最低专业组投档线约 ${detail.worstGroupScore} 分，分差达 ${detail.bestGroupScore - detail.worstGroupScore} 分。如果你以接近最低投档线的分数进入该校，大概率会被录取到较冷门的专业组。`}
                style={{ marginBottom: 12 }}
              />
              {item.category === 'chong' && (
                <Alert
                  type="info"
                  showIcon
                  message="冲刺建议"
                  description="该院校预估投档线高于你的分数，意味着正常发挥可能达不到录取线。建议关注该院校较冷门的专业组，录取机会相对更大。"
                  style={{ marginBottom: 12 }}
                />
              )}
              {item.category === 'bao' && (
                <Alert
                  type="success"
                  showIcon
                  message="保底建议"
                  description="该院校投档线明显低于你的分数，录取把握极大。可以考虑将其排在志愿表靠后位置作为兜底，前面的志愿用来冲更好的院校。"
                />
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
