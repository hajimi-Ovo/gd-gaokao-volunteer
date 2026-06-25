import { Tag } from 'antd'

interface ProbabilityBadgeProps {
  category: 'chong' | 'wen' | 'bao'
  probabilityLabel: string
}

const config = {
  chong: { color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e', label: '🔴 冲' },
  wen: { color: '#d48806', bg: '#fffbe6', border: '#ffe58f', label: '🟡 稳' },
  bao: { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f', label: '🟢 保' },
}

export default function ProbabilityBadge({ category, probabilityLabel }: ProbabilityBadgeProps) {
  const c = config[category]
  return (
    <span>
      <Tag
        style={{
          color: c.color,
          background: c.bg,
          border: `1px solid ${c.border}`,
          fontWeight: 600,
          marginRight: 4,
        }}
      >
        {c.label}
      </Tag>
      <Tag>{probabilityLabel}</Tag>
    </span>
  )
}
