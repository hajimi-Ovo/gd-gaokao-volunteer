import ReactECharts from 'echarts-for-react'
import type { UniversityScore } from '@/types'

interface TrendChartProps {
  scores: UniversityScore[]
  userRank?: number
  predictedRank?: number
}

export default function TrendChart({ scores, userRank, predictedRank }: TrendChartProps) {
  const sorted = [...scores].sort((a, b) => a.year - b.year)

  const years = sorted.map((s) => String(s.year))
  const ranks = sorted.map((s) => s.min_rank)
  const scoreValues = sorted.map((s) => s.min_score)

  // 添加预测年份
  if (predictedRank) {
    years.push('2026(预测)')
    ranks.push(predictedRank)
    scoreValues.push(null as unknown as number)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['最低录取排名', '最低录取分数'],
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        rotate: 30,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '排名',
        inverse: true,
        axisLabel: {
          formatter: (v: number) => (v / 10000).toFixed(1) + '万',
        },
      },
      {
        type: 'value',
        name: '分数',
        axisLabel: {
          formatter: '{value} 分',
        },
      },
    ],
    series: [
      {
        name: '最低录取排名',
        type: 'line',
        data: ranks,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#1677ff' },
        itemStyle: { color: '#1677ff' },
        markLine: userRank
          ? {
              silent: true,
              data: [
                {
                  yAxis: userRank,
                  label: { formatter: `你的排名: ${userRank.toLocaleString()}` },
                  lineStyle: { color: '#ff4d4f', type: 'dashed' },
                },
              ],
            }
          : undefined,
      },
      {
        name: '最低录取分数',
        type: 'line',
        yAxisIndex: 1,
        data: scoreValues,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: { width: 2, color: '#52c41a' },
        itemStyle: { color: '#52c41a' },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 350 }} />
}
