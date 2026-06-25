import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import {
  HomeOutlined,
  FormOutlined,
  SearchOutlined,
  BarChartOutlined,
  ProfileOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout
const { Title } = Typography

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/input', icon: <FormOutlined />, label: '输入信息' },
  { key: '/recommend', icon: <SearchOutlined />, label: '智能推荐' },
  { key: '/volunteer', icon: <ProfileOutlined />, label: '志愿填报' },
  { key: '/compare', icon: <BarChartOutlined />, label: '对比分析' },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentKey = '/' + location.pathname.split('/')[1]

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Title
        level={4}
        style={{ margin: 0, marginRight: 32, whiteSpace: 'nowrap', color: '#1677ff' }}
      >
        🎓 广东高考志愿填报
      </Title>
      <Menu
        mode="horizontal"
        selectedKeys={[currentKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, border: 'none' }}
      />
    </AntHeader>
  )
}
