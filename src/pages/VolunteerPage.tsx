import { useNavigate } from 'react-router-dom'
import { Typography, Card, Empty, Button, Space, Divider, Alert } from 'antd'
import { ArrowLeftOutlined, ClearOutlined, PrinterOutlined } from '@ant-design/icons'
import { useUserStore } from '@/store/userStore'
import VolunteerBoard from '@/components/volunteer/VolunteerBoard'
import VolunteerCheck from '@/components/volunteer/VolunteerCheck'
import { useVolunteerList } from '@/hooks/useVolunteerList'

const { Title, Text } = Typography

export default function VolunteerPage() {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const { checkPlan, clearCurrentPlan } = useVolunteerList()

  if (!profile.totalScore || !profile.rank) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Empty description="请先填写高考信息并获取推荐结果">
            <Button type="primary" onClick={() => navigate('/input')}>
              前往填写信息
            </Button>
          </Empty>
        </Card>
      </div>
    )
  }

  const checkResult = checkPlan()

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recommend')}>
          返回推荐
        </Button>
        <Button danger icon={<ClearOutlined />} onClick={clearCurrentPlan}>
          清空志愿表
        </Button>
        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
          打印志愿表
        </Button>
      </Space>

      <Alert
        message="广东省本科批次可填报 45 个院校专业组志愿，请按照「冲→稳→保」的顺序排列"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={4}>
        📋 我的志愿表
      </Title>

      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        考生：{profile.totalScore} 分 | 排名：{profile.rank.toLocaleString()} |{' '}
        {profile.preferredSubject === 'physics' ? '物理类' : '历史类'} |{' '}
        再选：{profile.reselectedSubjects.join('、')}
      </Text>

      {/* 合理性检查 */}
      <VolunteerCheck result={checkResult} />

      <Divider />

      {/* 志愿列表 */}
      <VolunteerBoard />
    </div>
  )
}
