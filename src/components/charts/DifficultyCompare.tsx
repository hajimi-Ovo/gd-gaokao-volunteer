import ReactECharts from 'echarts-for-react'
import type { ScoreRankEntry, YearDifficultyResult } from '@/types'

interface DifficultyCompareProps {
  rankingData: Record<string, ScoreRankEntry[]>
  targetYear: string
  difficultyAnalysis: YearDifficultyResult[]
}

export default function DifficultyCompare({
  rankingData,
  targetYear,
  difficultyAnalysis,
}: DifficultyCompareProps) {
  const years = Object.keys(rankingData).sort()

  // 为每个年份提取排名曲线（分数 → 排名）
  const series = years.map((year) => {
    const entries = rankingData[year]
    const similarity = difficultyAnalysis.find((d) => String(d.year) === year)
    const isTarget = year === targetYear

    return {
      name: `${year}年${isTarget ? '(目标)' : ''}`,
      type: 'line' as const,
      data: entries.map((e) => [e.score, e.cumulative]),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: isTarget ? 4 : 2,
        color: isTarget
          ? '#ff4d4f'
          : similarity && similarity.similarity >= 0.8
          ? '#52c41a'
          : similarity && similarity.similarity >= 0.6
          ? '#faad14'
          : '#d9d9d9',
      },
    }
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ seriesName: string; data: number[] }>) => {
        if (!params || params.length === 0) return ''
        let result = `分数: ${params[0].data[0]}分<br/>`
        for (const p of params) {
          result += `${p.seriesName}: 第 ${p.data[1].toLocaleString()} 名<br/>`
        }
        return result
      },
    },
    legend: {
      type: 'scroll',
      bottom: 0,
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '5%',
      bottom: '18%',
    },
    xAxis: {
      type: 'value',
      name: '分数',
      nameLocation: 'center',
      nameGap: 30,
      inverse: true,
      min: 400,
      max: 750,
      axisLabel: {
        formatter: '{value}分',
      },
    },
    yAxis: {
      type: 'value',
      name: '累计排名',
      axisLabel: {
        formatter: (v: number) => (v / 10000).toFixed(0) + '万',
      },
    },
    series,
  }

  return <ReactECharts option={option} style={{ height: 400 }} />
}
