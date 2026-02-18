"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { HeatmapCell } from "@/lib/queries/stats"

interface SatisfactionHeatmapProps {
  initialData: HeatmapCell[]
  selectedPeriod: number
}

// 曜日ラベル（DOW: 0=日, 1=月, ..., 6=土）
const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]
// 月〜土〜日の並び順（日本の慣習）
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const PERIOD_LABELS: Record<number, string> = {
  7: "7日",
  30: "30日",
  90: "90日",
  180: "180日",
  365: "365日",
}

function getScoreColor(score: number): string {
  if (score >= 4.5) return "bg-blue-600 text-white"
  if (score >= 4.0) return "bg-blue-200 text-blue-900"
  if (score >= 3.5) return "bg-orange-200 text-orange-900"
  return "bg-orange-500 text-white"
}

function getScoreBg(score: number): string {
  if (score >= 4.5) return "bg-blue-600"
  if (score >= 4.0) return "bg-blue-200"
  if (score >= 3.5) return "bg-orange-200"
  return "bg-orange-500"
}

export function SatisfactionHeatmap({ initialData, selectedPeriod }: SatisfactionHeatmapProps) {
  const [data, setData] = useState<HeatmapCell[]>(initialData)
  const [loading, setLoading] = useState(false)
  const isInitialMount = useRef(true)

  const fetchData = useCallback(async (days: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/heatmap?days=${days}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    fetchData(selectedPeriod)
  }, [selectedPeriod, fetchData])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">時間帯別 患者満足度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">時間帯別 患者満足度</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            データがありません
          </p>
        </CardContent>
      </Card>
    )
  }

  // Build lookup: key = "dayOfWeek-hour"
  const cellMap = new Map<string, HeatmapCell>()
  for (const cell of data) {
    cellMap.set(`${cell.dayOfWeek}-${cell.hour}`, cell)
  }

  // Determine hour range from data
  const hours = data.map((c) => c.hour)
  const minHour = Math.min(...hours)
  const maxHour = Math.max(...hours)
  const hourRange: number[] = []
  for (let h = minHour; h <= maxHour; h++) {
    hourRange.push(h)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">時間帯別 患者満足度</CardTitle>
        <p className="text-xs text-muted-foreground">直近{PERIOD_LABELS[selectedPeriod] ?? `${selectedPeriod}日`}のデータ</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full border-separate border-spacing-1 min-w-[400px]">
            <thead>
              <tr>
                <th className="w-12 text-left text-xs font-medium text-muted-foreground" />
                {DAY_ORDER.map((dow) => (
                  <th
                    key={dow}
                    className={`text-center text-xs font-medium ${
                      dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-muted-foreground"
                    }`}
                  >
                    {DAY_LABELS[dow]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hourRange.map((hour) => (
                <tr key={hour}>
                  <td className="pr-1 text-right text-xs font-medium text-muted-foreground tabular-nums">
                    {hour}時
                  </td>
                  {DAY_ORDER.map((dow) => {
                    const cell = cellMap.get(`${dow}-${hour}`)
                    if (!cell) {
                      return (
                        <td key={dow} className="text-center">
                          <div className="mx-auto flex h-10 w-full items-center justify-center rounded bg-gray-50 text-xs text-gray-300">
                            -
                          </div>
                        </td>
                      )
                    }
                    return (
                      <td key={dow} className="text-center">
                        <div
                          className={`group relative mx-auto flex h-10 w-full items-center justify-center rounded transition-transform hover:scale-105 ${getScoreColor(cell.avgScore)}`}
                          title={`${DAY_LABELS[dow]}曜 ${hour}時台: ${cell.avgScore.toFixed(1)}（${cell.count}件）`}
                        >
                          <span className="text-sm font-semibold tabular-nums">
                            {cell.avgScore.toFixed(1)}
                          </span>
                          {/* Tooltip on hover */}
                          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                            {cell.count}件
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded ${getScoreBg(4.5)}`} />
            <span>4.5+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded ${getScoreBg(4.0)}`} />
            <span>4.0-4.4</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded ${getScoreBg(3.5)}`} />
            <span>3.5-3.9</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded ${getScoreBg(3.0)}`} />
            <span>&lt;3.5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-gray-50 border border-gray-200" />
            <span>データなし</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
