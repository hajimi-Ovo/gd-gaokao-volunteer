import { Card, Row, Col, Alert, Typography, Progress } from 'antd'
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import type { VolunteerCheckResult } from '@/types'

const { Text } = Typography

interface VolunteerCheckProps {
  result: VolunteerCheckResult
}

export default function VolunteerCheck({ result }: VolunteerCheckProps) {
  return (
    <Card size="small" title="✅ 志愿合理性检查">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Progress
            type="circle"
            percent={result.score}
            strokeColor={
              result.score >= 80
                ? '#52c41a'
                : result.score >= 60
                ? '#faad14'
                : '#ff4d4f'
            }
            size={80}
          />
        </Col>
        <Col span={16}>
          {result.passed ? (
            <Alert
              message="志愿方案合理"
              description="冲稳保比例适当，志愿梯度合理"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          ) : (
            <Alert
              message="存在改进空间"
              type="warning"
              showIcon
              icon={<WarningOutlined />}
            />
          )}
        </Col>
      </Row>

      {result.warnings.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ color: '#ff4d4f' }}>⚠️ 注意事项：</Text>
          {result.warnings.map((w, i) => (
            <Alert
              key={i}
              message={w}
              type="warning"
              showIcon={false}
              style={{ marginTop: 4 }}
            />
          ))}
        </div>
      )}

      {result.suggestions.length > 0 && (
        <div>
          <Text strong style={{ color: '#1677ff' }}>💡 建议：</Text>
          {result.suggestions.map((s, i) => (
            <Alert
              key={i}
              message={s}
              type="info"
              showIcon={false}
              style={{ marginTop: 4 }}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
