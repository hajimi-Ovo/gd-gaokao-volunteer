import { useNavigate } from 'react-router-dom'
import { Table, Button, Tooltip, Tag, Typography, Space } from 'antd'
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { RecommendationResult, VolunteerItem } from '@/types'
import { useVolunteerStore } from '@/store/volunteerStore'
import { generateId } from '@/utils/storage'
import ProbabilityBadge from './ProbabilityBadge'

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

const hotnessLabel: Record<string, { text: string; color: string }> = {
  hot: { text: '🔥 热门专业组', color: 'red' },
  normal: { text: '普通专业组', color: 'default' },
  cold: { text: '❄️ 冷门专业组', color: 'default' },
}

export default function RecommendTable({ data, loading }: RecommendTableProps) {
  const navigate = useNavigate()
  const addItem = useVolunteerStore((s) => s.addItem)

  const handleAddToVolunteer = (rec: RecommendationResult) => {
    const item: VolunteerItem = {
      id: generateId(),
      universityId: rec.university.id,
      universityName: rec.university.name,
      universityProvince: rec.university.province,
      universityCity: rec.university.city,
      universityLevel: rec.university.level,
      groupCode: rec.groupCode,
      groupName: rec.groupName,
      category: rec.category,
      order: 0,
      predictedRank: rec.predictedMinRank,
      predictedScore: rec.predictedMinScore,
      scoreDiff: rec.scoreDiff,
      probability: rec.probabilityLabel,
      groupMajors: rec.groupMajors,
    }
    addItem(item)
  }

  const columns: ColumnsType<RecommendationResult> = [
    {
      title: '冲/稳/保',
      dataIndex: 'category',
      key: 'category',
      width: 140,
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
        <Space direction="vertical" size={0}>
          <a onClick={() => navigate(`/school/${record.university.id}`)}>
            {name}
          </a>
          <Space size={4} wrap>
            {record.university.isGuangdong && (
              <Tag color="green" style={{ fontSize: 11 }}>🏠 省内</Tag>
            )}
            {record.isCostEffective && (
              <Tag color="orange" style={{ fontSize: 11 }}>💎 高性价比</Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: '层次',
      dataIndex: ['university', 'level'],
      key: 'level',
      width: 85,
      render: (level: string) => (
        <Tag color={levelColor[level] || 'default'}>{levelLabel[level] || level}</Tag>
      ),
    },
    {
      title: '所在地',
      key: 'location',
      width: 90,
      render: (_, record) => (
        <Text>{record.university.province} {record.university.city}</Text>
      ),
    },
    {
      title: '预估分数',
      dataIndex: 'predictedMinScore',
      key: 'predictedMinScore',
      width: 85,
      sorter: (a, b) => a.predictedMinScore - b.predictedMinScore,
      render: (score: number) => (
        <Text strong style={{ fontSize: 15 }}>{score || '-'}</Text>
      ),
    },
    {
      title: (
        <Tooltip title="院校预估分与考生分数的差值">
          <span>分数差 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'scoreDiff',
      key: 'scoreDiff',
      width: 90,
      sorter: (a, b) => a.scoreDiff - b.scoreDiff,
      render: (diff: number) => {
        const prefix = diff > 0 ? `+${diff}` : `${diff}`
        const color = diff > 0 ? '#ff4d4f' : diff < 0 ? '#52c41a' : '#1677ff'
        const icon = diff > 10 ? '📈' : diff < -10 ? '📉' : '➡️'
        return (
          <Text strong style={{ color, fontSize: 14 }}>
            {icon} {prefix}分
          </Text>
        )
      },
    },
    {
      title: '预测排名',
      dataIndex: 'predictedMinRank',
      key: 'predictedMinRank',
      width: 100,
      sorter: (a, b) => a.predictedMinRank - b.predictedMinRank,
      render: (rank: number) => (
        <Text type="secondary">{rank.toLocaleString()}名</Text>
      ),
    },
    {
      title: '专业组',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 200,
      render: (name: string, record) => (
        <Tooltip
          title={
            <div style={{ maxWidth: 280 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {name || `专业组${record.groupCode}`}
              </div>
              {record.groupMajors.length > 0 && (
                <div>
                  <div style={{ marginTop: 4, color: '#999' }}>包含专业：</div>
                  <div>{record.groupMajors.join('、')}</div>
                </div>
              )}
              <div style={{ marginTop: 6 }}>
                <Tag color={hotnessLabel[record.groupHotness]?.color}>
                  {hotnessLabel[record.groupHotness]?.text || '普通专业组'}
                </Tag>
              </div>
              {record.bestGroupScore && record.worstGroupScore && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#ff4d4f' }}>
                  ⚠️ 该校最高专业组 {record.bestGroupScore}分，最低 {record.worstGroupScore}分，分差 {record.bestGroupScore - record.worstGroupScore}分
                </div>
              )}
            </div>
          }
        >
          <div>
            <Text>{name || `专业组${record.groupCode}`}</Text>
            <Tag
              color={record.groupHotness === 'cold' ? 'default' : record.groupHotness === 'hot' ? 'red' : 'blue'}
              style={{ marginLeft: 4, fontSize: 10 }}
            >
              {record.groupHotness === 'hot' ? '热门' : record.groupHotness === 'cold' ? '冷门' : '普通'}
            </Tag>
          </div>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
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
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (t) => `共 ${t} 条推荐（范围：±50分）`,
      }}
      scroll={{ x: 1200 }}
      size="middle"
      locale={{ emptyText: '请输入高考信息获取推荐结果' }}
    />
  )
}
