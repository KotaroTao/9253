"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Users, Star, Trophy } from "lucide-react"

interface StaffPerformance {
  id: string
  name: string
  role: string
  totalCount: number
  totalAvgScore: number | null
  monthCount: number
  monthAvgScore: number | null
}

export function StaffLeaderboard() {
  const [data, setData] = useState<StaffPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"month" | "total">("month")

  useEffect(() => {
    fetch("/api/staff-leaderboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {messages.common.loading}
        </CardContent>
      </Card>
    )
  }

  const hasData = data.some(
    (s) => (period === "month" ? s.monthCount : s.totalCount) > 0
  )

  // Sort by selected period
  const sorted = [...data].sort((a, b) => {
    const aCount = period === "month" ? a.monthCount : a.totalCount
    const bCount = period === "month" ? b.monthCount : b.totalCount
    return bCount - aCount
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              {messages.staffLeaderboard.title}
            </CardTitle>
          </div>
          <div className="flex rounded-lg border p-0.5">
            <button
              onClick={() => setPeriod("month")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {messages.staffLeaderboard.thisMonth}
            </button>
            <button
              onClick={() => setPeriod("total")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === "total"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {messages.staffLeaderboard.total}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="py-4 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              {messages.staffLeaderboard.noData}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {messages.staffLeaderboard.noDataDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((staff, index) => {
              const count = period === "month" ? staff.monthCount : staff.totalCount
              const avgScore = period === "month" ? staff.monthAvgScore : staff.totalAvgScore
              if (count === 0) return null

              return (
                <div
                  key={staff.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  {/* Rank */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {index === 0 ? (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{staff.name}</p>
                    <p className="text-[10px] text-muted-foreground">{staff.role}</p>
                  </div>

                  {/* Score */}
                  {avgScore != null && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{avgScore}</span>
                    </div>
                  )}

                  {/* Count */}
                  <div className="text-right">
                    <span className="text-sm font-bold">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      {messages.common.countSuffix}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
