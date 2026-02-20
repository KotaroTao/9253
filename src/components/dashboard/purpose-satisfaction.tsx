"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  INSURANCE_PURPOSES,
  SELF_PAY_PURPOSES,
} from "@/lib/constants"
import type { PurposeSatisfactionRow } from "@/lib/queries/stats"
import type { CustomRange } from "./analytics-charts"

interface PurposeSatisfactionProps {
  selectedPeriod: number
  customRange?: CustomRange | null
}

// Build label lookup from constants
const PURPOSE_LABELS: Record<string, string> = {}
for (const p of INSURANCE_PURPOSES) PURPOSE_LABELS[p.value] = p.label
for (const p of SELF_PAY_PURPOSES) PURPOSE_LABELS[p.value] = p.label

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  insurance: "保険診療",
  self_pay: "自費診療",
}

const INSURANCE_TYPE_COLORS: Record<string, { badge: string; bar: string }> = {
  insurance: { badge: "bg-blue-100 text-blue-700", bar: "bg-blue-500" },
  self_pay: { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
}

function getScoreColor(score: number): string {
  if (score >= 4.5) return "text-blue-600"
  if (score >= 4.0) return "text-blue-500"
  if (score >= 3.5) return "text-orange-500"
  return "text-red-500"
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, (score / 5) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums ${getScoreColor(score)}`}>
        {score.toFixed(2)}
      </span>
    </div>
  )
}

export function PurposeSatisfaction({ selectedPeriod, customRange = null }: PurposeSatisfactionProps) {
  const [data, setData] = useState<PurposeSatisfactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const isInitialMount = useRef(true)

  const fetchData = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/purpose-satisfaction?${query}`, {
        cache: "no-store",
      })
      if (res.ok) {
        setData(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const query = customRange
      ? `from=${customRange.from}&to=${customRange.to}`
      : `days=${selectedPeriod}`
    fetchData(query)
  }, [selectedPeriod, customRange, fetchData])

  // Group by insuranceType
  const grouped = data.reduce<Record<string, PurposeSatisfactionRow[]>>(
    (acc, row) => {
      if (!acc[row.insuranceType]) acc[row.insuranceType] = []
      acc[row.insuranceType].push(row)
      return acc
    },
    {}
  )

  // Sort: insurance first, then self_pay
  const sortedTypes = ["insurance", "self_pay"].filter((t) => grouped[t])

  // Calculate totals per insurance type
  const typeTotals: Record<string, { avgScore: number; count: number }> = {}
  for (const type of sortedTypes) {
    const rows = grouped[type]
    const totalCount = rows.reduce((sum, r) => sum + r.count, 0)
    const weightedSum = rows.reduce((sum, r) => sum + r.avgScore * r.count, 0)
    typeTotals[type] = {
      avgScore: totalCount > 0 ? Math.round((weightedSum / totalCount) * 100) / 100 : 0,
      count: totalCount,
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">診療区分×内容別 満足度</CardTitle>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">診療区分×内容別 満足度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[120px] items-center justify-center">
            <p className="text-sm text-muted-foreground">データがありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">診療区分×内容別 満足度</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedTypes.map((type) => {
          const rows = grouped[type]
          const total = typeTotals[type]
          const colors = INSURANCE_TYPE_COLORS[type] ?? INSURANCE_TYPE_COLORS.insurance

          return (
            <div key={type}>
              {/* Insurance type header */}
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${colors.badge}`}>
                  {INSURANCE_TYPE_LABELS[type] ?? type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {total.count}件
                </span>
                <ScoreBar score={total.avgScore} color={colors.bar} />
              </div>

              {/* Purpose rows */}
              <div className="space-y-1 pl-2">
                {rows.map((row) => (
                  <div
                    key={`${type}-${row.purpose}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {PURPOSE_LABELS[row.purpose] ?? row.purpose}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        {row.count}件
                      </span>
                    </div>
                    <ScoreBar score={row.avgScore} color={colors.bar} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
