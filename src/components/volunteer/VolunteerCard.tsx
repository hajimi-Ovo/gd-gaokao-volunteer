import { Card, Button, Space, Typography, Tooltip, Tag } from 'antd'
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { VolunteerItem } from '@/types'
import ProbabilityBadge from '@/components/recommend/ProbabilityBadge'

const { Text } = Typography

interface VolunteerCardProps {
  item: VolunteerItem
  index: number
  isFirst: boolean
  isLast: boolean
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onShowDetail: (item: VolunteerItem) => void
}

const levelLabel: Record<string, string> = {
  '985': '985',
  '211': '211',
  double_first_class: '双一流',
  public_undergraduate: '公办本科',
  private_undergraduate: '民办本科',
}

export default function VolunteerCard({
  item,
  index,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
  onShowDetail,
}: VolunteerCardProps) {
  const scoreDiffPrefix = item.scoreDiff > 0 ? '+' : ''
  const scoreDiffColor = item.scoreDiff > 0 ? '#ff4d4f' : item.scoreDiff < 0 ? '#52c41a' : '#1677ff'

  return (
    <Card
      size="small"
      hoverable
      style={{ marginBottom: 8 }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 300 }}>
          {/* 志愿序号 */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1677ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {index + 1}
          </div>

          <div style={{ flex: 1 }}>
            <Space size={4} style={{ marginBottom: 4 }}>
              <ProbabilityBadge category={item.category} probabilityLabel={item.probability} />
              {item.universityLevel && (
                <Tag color="default" style={{ fontSize: 10 }}>
                  {levelLabel[item.universityLevel] || item.universityLevel}
                </Tag>
              )}
            </Space>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ fontSize: 15 }}>
                {item.universityName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.universityProvince} {item.universityCity}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.groupName || `专业组 ${item.groupCode}`}
              </Text>
              <Tooltip title="预估分数与你的分数差值">
                <Text style={{ fontSize: 12, color: scoreDiffColor }}>
                  {scoreDiffPrefix}{item.scoreDiff}分
                </Text>
              </Tooltip>
              <Text type="secondary" style={{ fontSize: 12 }}>
                预估{item.predictedScore}分 | 排名{item.predictedRank.toLocaleString()}
              </Text>
            </div>
          </div>
        </div>

        <Space>
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onShowDetail(item)}
            />
          </Tooltip>
          <Tooltip title="上移">
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={isFirst}
              onClick={() => onMoveUp(item.id)}
            />
          </Tooltip>
          <Tooltip title="下移">
            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={isLast}
              onClick={() => onMoveDown(item.id)}
            />
          </Tooltip>
          <Tooltip title="移除">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemove(item.id)}
            />
          </Tooltip>
        </Space>
      </div>
    </Card>
  )
}
