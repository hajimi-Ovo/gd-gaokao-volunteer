import { Card, Button, Space, Typography, Tooltip } from 'antd'
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
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
}

export default function VolunteerCard({
  item,
  index,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: VolunteerCardProps) {
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
            </Space>
            <div>
              <Text strong style={{ fontSize: 15 }}>
                {item.universityName}
              </Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {item.groupName || `专业组 ${item.groupCode}`}
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                预测排名：{item.predictedRank.toLocaleString()}
              </Text>
            </div>
          </div>
        </div>

        <Space>
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
