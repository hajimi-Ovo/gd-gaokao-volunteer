import { useNavigate } from 'react-router-dom'
import { Table, Button, Tooltip, Tag, Typography } from 'antd'
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { RecommendationResult } from '@/types'
import { useVolunteerStore } from '@/store/volunteerStore'
import { generateId } from '@/utils/storage'
import ProbabilityBadge from './ProbabilityBadge'
import type { VolunteerItem } from '@/types'

const { Text } = Typography

interface RecommendTableProps {
  data: RecommendationResult[]
  loading: boolean
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

export default function RecommendTable({ data, loading }: RecommendTableProps) {
  const navigate = useNavigate()
  const addItem = useVolunteerStore((s) => s.addItem)

  const handleAddToVolunteer = (rec: RecommendationResult) => {
    const item: VolunteerItem = {
      id: generateId(),
      universityId: rec.university.id,
      universityName: rec.university.name,
      groupCode: rec.groupCode,
      groupName: rec.groupName,
      category: rec.category,
      order: 0,
      predictedRank: rec.predictedMinRank,
      probability: rec.probabilityLabel,
    }
    addItem(item)
  }

  const columns: ColumnsType<RecommendationResult> = [
    {
      title: '冲/稳/保',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat: 'chong' | 'wen' | 'bao', record) => (
        <ProbabilityBadge category={cat} probabilityLabel={record.probabilityLabel} />
      ),
      filters: [
        { text: '🔴 冲', value: 'chong' },
        { text: '🟡 稳', value: 'wen' },
        { text: '🟢 保', value: 'bao' },
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: '院校名称',
      dataIndex: ['university', 'name'],
      key: 'name',
      width: 200,
      render: (name: string, record) => (
        <a onClick={() => navigate(`/school/${record.university.id}`)}>
          {name}
        </a>
      ),
    },
    {
      title: '层次',
      dataIndex: ['university', 'level'],
      key: 'level',
      width: 90,
      render: (level: string) => (
        <Tag color={levelColor[level] || 'default'}>{levelLabel[level] || level}</Tag>
      ),
    },
    {
      title: '所在地',
      key: 'location',
      width: 100,
      render: (_, record) => (
        <Text>{record.university.province} {record.university.city}</Text>
      ),
    },
    {
      title: (
        <Tooltip title="基于历年难度加权预测的最低录取排名">
          <span>预测排名 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'predictedMinRank',
      key: 'predictedMinRank',
      width: 110,
      sorter: (a, b) => a.predictedMinRank - b.predictedMinRank,
      render: (rank: number) => <Text strong>{rank.toLocaleString()}</Text>,
    },
    {
      title: (
        <Tooltip title="根据预测排名反查2026一分一段表">
          <span>预估分数 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'predictedMinScore',
      key: 'predictedMinScore',
      width: 90,
      sorter: (a, b) => a.predictedMinScore - b.predictedMinScore,
      render: (score: number) => <Text strong>{score || '-'}</Text>,
    },
    {
      title: '排名差距',
      dataIndex: 'rankDiffPercent',
      key: 'rankDiffPercent',
      width: 100,
      sorter: (a, b) => a.rankDiffPercent - b.rankDiffPercent,
      render: (pct: number) => {
        const color = pct > 5 ? '#ff4d4f' : pct < -5 ? '#52c41a' : '#faad14'
        const prefix = pct > 0 ? '↑' : pct < 0 ? '↓' : '→'
        return <Text style={{ color }}>{prefix} {Math.abs(pct)}%</Text>
      },
    },
    {
      title: '专业组',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 180,
      ellipsis: true,
      render: (name: string, record) => (
        <Tooltip title={name || record.groupCode}>
          <Text>{name || `专业组${record.groupCode}`}</Text>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleAddToVolunteer(record)}
        >
          加入志愿表
        </Button>
      ),
    },
  ]

  return (
    <Table<RecommendationResult>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey={(record) => `${record.university.id}_${record.groupCode}`}
      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 所院校` }}
      scroll={{ x: 1100 }}
      size="middle"
      locale={{ emptyText: '请输入高考信息获取推荐结果' }}
    />
  )
}
