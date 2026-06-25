import { useNavigate } from 'react-router-dom'
import { Card, Typography, Form, InputNumber, Select, Button, Space, Divider, Radio } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useUserStore } from '@/store/userStore'
import type { ExamCategory } from '@/types'

const { Title, Text } = Typography

const reselectedOptions = [
  { value: '化学', label: '化学' },
  { value: '生物', label: '生物' },
  { value: '政治', label: '政治' },
  { value: '地理', label: '地理' },
]

const cityOptions = [
  '广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州',
  '北京', '上海', '南京', '杭州', '武汉', '成都', '西安', '长沙',
]

const majorOptions = ['工学', '医学', '理学', '经管', '文史哲', '法学', '师范', '农林', '艺术体育']

export default function InputPage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useUserStore()
  const [form] = Form.useForm()

  const handleFinish = (values: Record<string, unknown>) => {
    setProfile({
      totalScore: values.totalScore as number,
      rank: values.rank as number,
      preferredSubject: values.preferredSubject as ExamCategory,
      reselectedSubjects: (values.reselectedSubjects as string[]) || [],
      cityPreference: (values.cityPreference as string[]) || [],
      majorPreference: (values.majorPreference as string[]) || [],
      levelPreference: (values.levelPreference as string[]) || [],
    })
    navigate('/recommend')
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          📝 填写你的高考信息
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          请确保填写的分数和排名与广东省教育考试院官方公布一致
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            preferredSubject: profile.preferredSubject || 'physics',
            reselectedSubjects: profile.reselectedSubjects || [],
            cityPreference: profile.cityPreference || [],
            majorPreference: profile.majorPreference || [],
          }}
        >
          <Form.Item
            label="高考总分"
            name="totalScore"
            rules={[
              { required: true, message: '请输入高考分数' },
              { type: 'number', min: 100, max: 750, message: '分数范围 100-750' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="例：600"
              size="large"
              min={100}
              max={750}
            />
          </Form.Item>

          <Form.Item
            label="全省排名（位次）"
            name="rank"
            rules={[
              { required: true, message: '请输入全省排名' },
              { type: 'number', min: 1, message: '排名必须大于 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="例：25000"
              size="large"
              min={1}
            />
          </Form.Item>

          <Divider />

          <Form.Item
            label="首选科目"
            name="preferredSubject"
            rules={[{ required: true, message: '请选择首选科目' }]}
          >
            <Radio.Group size="large">
              <Radio.Button value="physics">物理类</Radio.Button>
              <Radio.Button value="history">历史类</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="再选科目（2门）"
            name="reselectedSubjects"
            rules={[
              { required: true, message: '请选择再选科目' },
              { type: 'array', max: 2, message: '最多选择 2 门' },
              { type: 'array', min: 2, message: '请选择 2 门' },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="请选择 2 门再选科目"
              size="large"
              maxCount={2}
              options={reselectedOptions}
            />
          </Form.Item>

          <Divider>以下为可选信息（用于精准推荐）</Divider>

          <Form.Item label="目标城市偏好" name="cityPreference">
            <Select
              mode="multiple"
              placeholder="不限（可多选）"
              size="large"
              options={cityOptions.map((c) => ({ value: c, label: c }))}
            />
          </Form.Item>

          <Form.Item label="目标专业方向" name="majorPreference">
            <Select
              mode="multiple"
              placeholder="不限（可多选）"
              size="large"
              options={majorOptions.map((m) => ({ value: m, label: m }))}
            />
          </Form.Item>

          <Form.Item label="院校层次偏好" name="levelPreference">
            <Select
              mode="multiple"
              placeholder="不限（可多选）"
              size="large"
              options={[
                { value: '985', label: '985 院校' },
                { value: '211', label: '211 院校' },
                { value: 'double_first_class', label: '双一流' },
                { value: 'public_undergraduate', label: '公办本科' },
                { value: 'private_undergraduate', label: '民办本科' },
              ]}
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button type="primary" htmlType="submit" size="large" icon={<ArrowRightOutlined />}>
                开始智能推荐
              </Button>
              <Button size="large" onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
