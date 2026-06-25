import { Alert } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

export default function Disclaimer() {
  return (
    <Alert
      message="免责声明"
      description="本系统提供的所有推荐结果及录取概率均基于历史数据推算，仅供参考，不构成正式填报建议。请以广东省教育考试院及院校官方公布的招生信息为准，谨慎做出最终决定。"
      type="info"
      showIcon
      icon={<InfoCircleOutlined />}
      closable
      style={{ marginBottom: 16 }}
    />
  )
}
