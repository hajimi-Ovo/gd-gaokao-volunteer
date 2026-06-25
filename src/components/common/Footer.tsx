import { Layout, Typography } from 'antd'

const { Footer: AntFooter } = Layout
const { Text } = Typography

export default function Footer() {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
      <Text type="secondary">
        🎓 广东省高考志愿填报参考系统 | 数据仅供参考，请以广东省教育考试院官方公布为准
      </Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        © 2026 Gaokao Volunteer Reference System · 非官方平台 · 填报决策请谨慎
      </Text>
    </AntFooter>
  )
}
