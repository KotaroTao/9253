"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Loader2, RefreshCw, ShieldCheck, Activity, Trophy } from "lucide-react"
import type { PxRankLabel } from "@/types/px-value"

interface PxClinicResult {
  clinicId: string
  clinicName: string
  clinicSlug: string
  pxValue: number
  pxRank: PxRankLabel
  weightedAvg: number
  responseCount: number
  trustAuthenticityRate: number
  stabilityScore: number
  rank: number
}

interface PxValueResponse {
  clinics: PxClinicResult[]
  totalClinics: number
  generatedAt: string
}

const RANK_STYLES: Record<PxRankLabel, string> = {
  SSS: "bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 font-black",
  S: "bg-gradient-to-r from-violet-500 to-purple-400 text-white font-bold",
  A: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold",
  B: "bg-gray-200 text-gray-600 font-semibold",
}

function RankBadge({ rank }: { rank: PxRankLabel }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs ${RANK_STYLES[rank]}`}>
      {rank}
    </span>
  )
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {value.toFixed(1)}
      </span>
    </div>
  )
}

export function PxValueDashboard() {
  const [data, setData] = useState<PxValueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/px-values")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      setError(messages.pxValue.error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" />
              {messages.pxValue.adminTitle}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {messages.pxValue.adminDescription}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !data && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {messages.pxValue.loading}
          </div>
        )}

        {error && !data && (
          <p className="py-8 text-center text-sm text-red-500">{error}</p>
        )}

        {data && data.clinics.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {messages.pxValue.noData}
          </p>
        )}

        {data && data.clinics.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">クリニック</th>
                    <th className="pb-2 pr-3 text-center">{messages.pxValue.rank}</th>
                    <th className="pb-2 pr-3 text-right">{messages.pxValue.score}</th>
                    <th className="pb-2 pr-3 text-right">{messages.pxValue.weightedAvg}</th>
                    <th className="pb-2 pr-3 text-right">{messages.pxValue.responses}</th>
                    <th className="pb-2 pr-3">{messages.pxValue.authenticity}</th>
                    <th className="pb-2">{messages.pxValue.stability}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clinics.map((clinic) => (
                    <tr key={clinic.clinicId} className="border-b last:border-0">
                      <td className="py-3 pr-3 text-xs font-medium text-muted-foreground">
                        {clinic.rank}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-medium">{clinic.clinicName}</div>
                        <div className="text-[10px] text-muted-foreground">/{clinic.clinicSlug}</div>
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <RankBadge rank={clinic.pxRank} />
                      </td>
                      <td className="py-3 pr-3 text-right font-bold tabular-nums">
                        {clinic.pxValue.toFixed(1)}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">
                        {clinic.weightedAvg.toFixed(2)}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">
                        {clinic.responseCount.toLocaleString()}
                      </td>
                      <td className="w-28 py-3 pr-3">
                        <ScoreBar
                          value={clinic.trustAuthenticityRate}
                          color="bg-emerald-500"
                        />
                      </td>
                      <td className="w-28 py-3">
                        <ScoreBar
                          value={clinic.stabilityScore}
                          color="bg-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {data.clinics.map((clinic) => (
                <div key={clinic.clinicId} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{clinic.rank}
                        </span>
                        <span className="truncate font-medium text-sm">{clinic.clinicName}</span>
                      </div>
                    </div>
                    <RankBadge rank={clinic.pxRank} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{messages.pxValue.score}</p>
                      <p className="text-lg font-bold tabular-nums">{clinic.pxValue.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{messages.pxValue.weightedAvg}</p>
                      <p className="text-lg font-bold tabular-nums">{clinic.weightedAvg.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        {messages.pxValue.authenticity}
                      </p>
                      <ScoreBar value={clinic.trustAuthenticityRate} color="bg-emerald-500" />
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        {messages.pxValue.stability}
                      </p>
                      <ScoreBar value={clinic.stabilityScore} color="bg-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with generation timestamp */}
            <div className="mt-4 flex items-center justify-end text-[10px] text-muted-foreground">
              {messages.pxValue.generatedAt}:{" "}
              {new Date(data.generatedAt).toLocaleString("ja-JP", {
                timeZone: "Asia/Tokyo",
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
