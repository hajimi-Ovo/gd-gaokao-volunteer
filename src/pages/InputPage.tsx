import { useNavigate } from 'react-router-dom'
import { Card, Typography, Form, InputNumber, Select, Button, Space, Divider, Radio, Cascader } from 'antd'
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

const provinceOptions = [
  { value: '广东', label: '广东省' },
  { value: '北京', label: '北京市' },
  { value: '上海', label: '上海市' },
  { value: '江苏', label: '江苏省' },
  { value: '浙江', label: '浙江省' },
  { value: '湖北', label: '湖北省' },
  { value: '湖南', label: '湖南省' },
  { value: '四川', label: '四川省' },
  { value: '重庆', label: '重庆市' },
  { value: '福建', label: '福建省' },
  { value: '陕西', label: '陕西省' },
  { value: '天津', label: '天津市' },
  { value: '山东', label: '山东省' },
  { value: '辽宁', label: '辽宁省' },
  { value: '吉林', label: '吉林省' },
  { value: '黑龙江', label: '黑龙江省' },
  { value: '安徽', label: '安徽省' },
  { value: '江西', label: '江西省' },
  { value: '河南', label: '河南省' },
  { value: '河北', label: '河北省' },
  { value: '山西', label: '山西省' },
  { value: '云南', label: '云南省' },
  { value: '贵州', label: '贵州省' },
  { value: '广西', label: '广西' },
  { value: '海南', label: '海南省' },
  { value: '甘肃', label: '甘肃省' },
  { value: '宁夏', label: '宁夏' },
  { value: '青海', label: '青海省' },
  { value: '西藏', label: '西藏' },
  { value: '新疆', label: '新疆' },
  { value: '内蒙古', label: '内蒙古' },
]

// 专业方向三级级联数据
const majorCascaderOptions = [
  {
    value: '工学',
    label: '🔧 工学',
    children: [
      { value: '计算机类', label: '计算机类', children: [
        { value: '计算机科学与技术', label: '计算机科学与技术' },
        { value: '软件工程', label: '软件工程' },
        { value: '人工智能', label: '人工智能' },
        { value: '网络空间安全', label: '网络空间安全' },
        { value: '数据科学与大数据技术', label: '数据科学与大数据技术' },
      ]},
      { value: '电子信息类', label: '电子信息类', children: [
        { value: '电子信息工程', label: '电子信息工程' },
        { value: '通信工程', label: '通信工程' },
        { value: '微电子科学与工程', label: '微电子科学与工程' },
      ]},
      { value: '机械类', label: '机械类' },
      { value: '电气类', label: '电气类' },
      { value: '土木建筑类', label: '土木建筑类' },
      { value: '材料类', label: '材料类' },
      { value: '自动化类', label: '自动化类' },
    ],
  },
  {
    value: '理学',
    label: '📐 理学',
    children: [
      { value: '数学类', label: '数学类' },
      { value: '物理学类', label: '物理学类' },
      { value: '化学类', label: '化学类' },
      { value: '生物科学类', label: '生物科学类' },
      { value: '统计学类', label: '统计学类' },
    ],
  },
  {
    value: '医学',
    label: '🏥 医学',
    children: [
      { value: '临床医学类', label: '临床医学类', children: [
        { value: '临床医学', label: '临床医学' },
        { value: '医学影像学', label: '医学影像学' },
        { value: '麻醉学', label: '麻醉学' },
        { value: '儿科学', label: '儿科学' },
      ]},
      { value: '口腔医学类', label: '口腔医学类' },
      { value: '药学类', label: '药学类' },
      { value: '护理学类', label: '护理学类' },
      { value: '公共卫生类', label: '公共卫生类' },
    ],
  },
  {
    value: '经管',
    label: '💰 经管',
    children: [
      { value: '经济学类', label: '经济学类' },
      { value: '金融学类', label: '金融学类' },
      { value: '工商管理类', label: '工商管理类' },
      { value: '会计学', label: '会计学' },
    ],
  },
  {
    value: '文史哲',
    label: '📚 文史哲',
    children: [
      { value: '中国语言文学类', label: '中国语言文学类' },
      { value: '外国语言文学类', label: '外国语言文学类' },
      { value: '历史学类', label: '历史学类' },
      { value: '哲学类', label: '哲学类' },
      { value: '新闻传播学类', label: '新闻传播学类' },
    ],
  },
  {
    value: '法学',
    label: '⚖️ 法学',
    children: [
      { value: '法学类', label: '法学类' },
      { value: '政治学类', label: '政治学类' },
      { value: '社会学类', label: '社会学类' },
    ],
  },
  {
    value: '师范',
    label: '🎓 师范',
    children: [
      { value: '教育学类', label: '教育学类' },
      { value: '心理学类', label: '心理学类' },
      { value: '学科教学类', label: '学科教学类' },
    ],
  },
  {
    value: '农林',
    label: '🌾 农林',
    children: [
      { value: '农学类', label: '农学类' },
      { value: '林学类', label: '林学类' },
      { value: '动物科学类', label: '动物科学类' },
      { value: '食品科学与工程类', label: '食品科学与工程类' },
    ],
  },
]

const levelOptions = [
  { value: '985', label: '985 院校' },
  { value: '211', label: '211 院校' },
  { value: 'double_first_class', label: '双一流' },
  { value: 'public_undergraduate', label: '公办本科' },
  { value: 'private_undergraduate', label: '民办本科' },
]

export default function InputPage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useUserStore()
  const [form] = Form.useForm()

  const handleFinish = (values: Record<string, unknown>) => {
    // 处理专业方向级联数据，拆分为大类和中类
    const majorCascader = (values.majorCascader as string[][]) || []
    const majorPreference: string[] = []
    const majorSubPreference: string[] = []
    for (const path of majorCascader) {
      if (path.length >= 1 && !majorPreference.includes(path[0])) {
        majorPreference.push(path[0])
      }
      if (path.length >= 2 && !majorSubPreference.includes(path[1])) {
        majorSubPreference.push(path[1])
      }
    }

    setProfile({
      totalScore: values.totalScore as number,
      rank: values.rank as number,
      preferredSubject: values.preferredSubject as ExamCategory,
      reselectedSubjects: (values.reselectedSubjects as string[]) || [],
      provincePreference: (values.provincePreference as string[]) || [],
      majorPreference,
      majorSubPreference,
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
            provincePreference: profile.provincePreference || [],
            majorCascader: [],
            levelPreference: profile.levelPreference || [],
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

          <Form.Item label="目标省份偏好" name="provincePreference">
            <Select
              mode="multiple"
              placeholder="不限省份（可多选）"
              size="large"
              maxTagCount={3}
              showSearch
              options={provinceOptions}
            />
          </Form.Item>

          <Form.Item label="目标专业方向（可选择到细分专业）" name="majorCascader">
            <Cascader
              style={{ width: '100%' }}
              size="large"
              multiple
              maxTagCount={3}
              placeholder="不限专业（可多选，支持大类/中类/细分三级）"
              options={majorCascaderOptions}
              changeOnSelect
            />
          </Form.Item>

          <Form.Item label="院校层次偏好" name="levelPreference">
            <Select
              mode="multiple"
              placeholder="不限（可多选）"
              size="large"
              options={levelOptions}
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
