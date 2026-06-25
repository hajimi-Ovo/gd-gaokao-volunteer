import { useNavigate } from 'react-router-dom'
import { Typography, Button, Card, Row, Col, Steps, Space } from 'antd'
import {
  FormOutlined,
  SearchOutlined,
  ProfileOutlined,
  BarChartOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import Disclaimer from '@/components/common/Disclaimer'

const { Title, Paragraph } = Typography

const features = [
  {
    icon: <FormOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
    title: '输入分数排名',
    description: '录入高考分数、全省排名、选科组合，系统自动匹配分析',
  },
  {
    icon: <SearchOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    title: '智能推荐院校',
    description: '基于历年数据与难度年份对标，推荐冲稳保三档院校',
  },
  {
    icon: <ProfileOutlined style={{ fontSize: 32, color: '#faad14' }} />,
    title: '模拟志愿填报',
    description: '按广东省45个志愿格式，模拟正式填报流程',
  },
  {
    icon: <BarChartOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    title: '数据可视化',
    description: '排名趋势、录取概率、院校对比，一目了然',
  },
]

const steps = [
  { title: '输入信息', description: '填写分数与选科' },
  { title: '查看推荐', description: '获取冲稳保建议' },
  { title: '选择志愿', description: '勾选心仪院校专业' },
  { title: '导出方案', description: '保存或打印志愿表' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div>
      <Disclaimer />

      {/* Hero 区域 */}
      <Card style={{ marginBottom: 24, textAlign: 'center', padding: '40px 20px' }}>
        <Title level={1} style={{ fontSize: 36, marginBottom: 16 }}>
          🎓 广东省高考志愿填报参考系统
        </Title>
        <Paragraph style={{ fontSize: 16, color: '#666', maxWidth: 600, margin: '0 auto 24px' }}>
          专为广东考生打造的志愿填报辅助平台。基于历年录取数据，结合年份难度对标，
          为你的分数找到最匹配的院校与专业。
        </Paragraph>
        <Space size="middle">
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate('/input')}
          >
            开始填报
          </Button>
          <Button size="large" onClick={() => navigate('/compare')}>
            浏览院校数据
          </Button>
        </Space>
      </Card>

      {/* 特色介绍 */}
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        四步完成志愿填报
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {features.map((f, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <div style={{ marginBottom: 12 }}>{f.icon}</div>
              <Title level={5}>{f.title}</Title>
              <Paragraph type="secondary">{f.description}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 流程步骤 */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          📋 使用流程
        </Title>
        <Steps
          direction="horizontal"
          size="small"
          current={-1}
          items={steps}
        />
      </Card>
    </div>
  )
}
