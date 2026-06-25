import { useMemo } from 'react'
import { Typography, Collapse, Empty, Statistic, Row, Col, Tag } from 'antd'
import { useVolunteerStore } from '@/store/volunteerStore'
import VolunteerCard from './VolunteerCard'

const { Text } = Typography

export default function VolunteerBoard() {
  const plans = useVolunteerStore((s) => s.plans)
  const currentPlanId = useVolunteerStore((s) => s.currentPlanId)
  const removeItem = useVolunteerStore((s) => s.removeItem)
  const reorderItems = useVolunteerStore((s) => s.reorderItems)

  const plan = plans.find((p) => p.id === currentPlanId)

  const grouped = useMemo(() => {
    if (!plan) return { chong: [], wen: [], bao: [] }
    return {
      chong: plan.items
        .filter((i) => i.category === 'chong')
        .sort((a, b) => b.predictedRank - a.predictedRank),
      wen: plan.items
        .filter((i) => i.category === 'wen')
        .sort((a, b) => b.predictedRank - a.predictedRank),
      bao: plan.items
        .filter((i) => i.category === 'bao')
        .sort((a, b) => a.predictedRank - b.predictedRank),
    }
  }, [plan])

  const handleRemove = (id: string) => removeItem(id)

  const handleMoveUp = (id: string) => {
    if (!plan) return
    const items = [...plan.items]
    const idx = items.findIndex((i) => i.id === id)
    if (idx <= 0) return
    ;[items[idx - 1], items[idx]] = [items[idx], items[idx - 1]]
    reorderItems(items.map((it, i) => ({ ...it, order: i })))
  }

  const handleMoveDown = (id: string) => {
    if (!plan) return
    const items = [...plan.items]
    const idx = items.findIndex((i) => i.id === id)
    if (idx < 0 || idx >= items.length - 1) return
    ;[items[idx], items[idx + 1]] = [items[idx + 1], items[idx]]
    reorderItems(items.map((it, i) => ({ ...it, order: i })))
  }

  if (!plan || plan.items.length === 0) {
    return (
      <Empty
        description="志愿表为空，请前往推荐页面添加志愿"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  const total = plan.items.length

  const renderCategory = (
    category: 'chong' | 'wen' | 'bao',
    label: string,
    color: string,
    recommendedCount: string
  ) => {
    const items = grouped[category]
    if (items.length === 0) return null

    return (
      <Collapse
        defaultActiveKey={[category]}
        style={{ marginBottom: 16 }}
        items={[
          {
            key: category,
            label: (
              <span>
                <Tag color={color} style={{ fontWeight: 600 }}>
                  {label}
                </Tag>
                <Text>
                  {items.length} 个志愿 (建议 {recommendedCount})
                </Text>
              </span>
            ),
            children: items.map((item, idx) => (
              <VolunteerCard
                key={item.id}
                item={item}
                index={plan.items.findIndex((i) => i.id === item.id)}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
                onRemove={handleRemove}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            )),
          },
        ]}
      />
    )
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="已填志愿"
            value={total}
            suffix="/ 45"
            valueStyle={{ color: total >= 10 ? '#52c41a' : '#faad14' }}
          />
        </Col>
        <Col span={8}>
          <Statistic title="🔴 冲" value={grouped.chong.length} suffix="个" />
        </Col>
        <Col span={8}>
          <Statistic title="🟡 稳" value={grouped.wen.length} suffix="个" />
        </Col>
        <Col span={8}>
          <Statistic title="🟢 保" value={grouped.bao.length} suffix="个" />
        </Col>
      </Row>

      {renderCategory('chong', '🔴 冲刺', '#ff4d4f', '15-20 个')}
      {renderCategory('wen', '🟡 稳妥', '#faad14', '15-20 个')}
      {renderCategory('bao', '🟢 保底', '#52c41a', '5-10 个')}
    </div>
  )
}
