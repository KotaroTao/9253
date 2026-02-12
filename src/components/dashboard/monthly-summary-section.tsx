"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown, Save, Check } from "lucide-react"

interface MonthlySummary {
  totalVisits: number | null
  totalRevenue: number | null
  selfPayRevenue: number | null
}

interface MonthlySummarySectionProps {
  year: number
  month: number
  initialSummary: MonthlySummary | null
  prevSummary: MonthlySummary | null
  surveyCount: number
  tallyNewPatientCount: number
  tallySelfPayConversionCount: number
}

function DerivedDelta({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) return null
  const isUp = diff > 0
  return (
    <span className={`ml-1 text-xs ${isUp ? "text-green-600" : "text-red-500"}`}>
      {isUp ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
      {" "}{isUp ? "+" : ""}{diff}
    </span>
  )
}

export function MonthlySummarySection({
  year,
  month,
  initialSummary,
  prevSummary,
  surveyCount,
  tallyNewPatientCount,
  tallySelfPayConversionCount,
}: MonthlySummarySectionProps) {
  const [totalVisits, setTotalVisits] = useState(initialSummary?.totalVisits?.toString() ?? "")
  const [totalRevenue, setTotalRevenue] = useState(initialSummary?.totalRevenue?.toString() ?? "")
  const [selfPayRevenue, setSelfPayRevenue] = useState(initialSummary?.selfPayRevenue?.toString() ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Reset when month changes
  useEffect(() => {
    setTotalVisits(initialSummary?.totalVisits?.toString() ?? "")
    setTotalRevenue(initialSummary?.totalRevenue?.toString() ?? "")
    setSelfPayRevenue(initialSummary?.selfPayRevenue?.toString() ?? "")
    setSaved(false)
  }, [year, month, initialSummary])

  const visits = totalVisits ? parseInt(totalVisits) : null
  const revenue = totalRevenue ? parseInt(totalRevenue) : null
  const selfPay = selfPayRevenue ? parseInt(selfPayRevenue) : null

  // Derived metrics (calculated live as user types)
  const surveyResponseRate =
    visits != null && visits > 0
      ? Math.round((surveyCount / visits) * 1000) / 10
      : null

  const newPatientRate =
    visits != null && visits > 0
      ? Math.round((tallyNewPatientCount / visits) * 1000) / 10
      : null

  const selfPayRatio =
    revenue != null && revenue > 0 && selfPay != null
      ? Math.round((selfPay / revenue) * 1000) / 10
      : null

  const revenuePerVisit =
    visits != null && visits > 0 && revenue != null
      ? Math.round((revenue / visits) * 10) / 10
      : null

  const selfPayUnitPrice =
    selfPay != null && tallySelfPayConversionCount > 0
      ? Math.round((selfPay / tallySelfPayConversionCount) * 10) / 10
      : null

  const insuranceRevenue =
    revenue != null && selfPay != null
      ? revenue - selfPay
      : null

  // Previous month derived metrics for comparison
  const prevVisits = prevSummary?.totalVisits
  const prevRevenue = prevSummary?.totalRevenue
  const prevSelfPay = prevSummary?.selfPayRevenue

  const prevSelfPayRatio =
    prevRevenue != null && prevRevenue > 0 && prevSelfPay != null
      ? Math.round((prevSelfPay / prevRevenue) * 1000) / 10
      : null

  const prevRevenuePerVisit =
    prevVisits != null && prevVisits > 0 && prevRevenue != null
      ? Math.round((prevRevenue / prevVisits) * 10) / 10
      : null

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/monthly-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          totalVisits: visits,
          totalRevenue: revenue,
          selfPayRevenue: selfPay,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const hasInput = visits != null || revenue != null || selfPay != null

  const derivedMetrics = [
    {
      label: messages.monthlyMetrics.surveyResponseRate,
      value: surveyResponseRate,
      format: (v: number) => `${v}%`,
      detail: surveyCount > 0 ? `(${surveyCount}/${visits})` : null,
      prev: null as number | null,
    },
    {
      label: messages.monthlyMetrics.newPatientRate,
      value: newPatientRate,
      format: (v: number) => `${v}%`,
      detail: tallyNewPatientCount > 0 ? `(${tallyNewPatientCount}/${visits})` : null,
      prev: null as number | null,
    },
    {
      label: messages.monthlyMetrics.selfPayRatio,
      value: selfPayRatio,
      format: (v: number) => `${v}%`,
      detail: selfPay != null && revenue != null ? `(${selfPay}/${revenue})` : null,
      prev: prevSelfPayRatio,
    },
    {
      label: messages.monthlyMetrics.revenuePerVisit,
      value: revenuePerVisit,
      format: (v: number) => `${v}${messages.monthlyMetrics.unitMan}`,
      detail: null,
      prev: prevRevenuePerVisit,
    },
    {
      label: messages.monthlyMetrics.selfPayUnitPrice,
      value: selfPayUnitPrice,
      format: (v: number) => `${v}${messages.monthlyMetrics.unitMan}`,
      detail: selfPay != null && tallySelfPayConversionCount > 0
        ? `(${selfPay}/${tallySelfPayConversionCount})`
        : null,
      prev: null as number | null,
    },
    {
      label: messages.monthlyMetrics.insuranceRevenue,
      value: insuranceRevenue,
      format: (v: number) => `${v}${messages.monthlyMetrics.unitMan}`,
      detail: null,
      prev: prevRevenue != null && prevSelfPay != null ? prevRevenue - prevSelfPay : null,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{messages.monthlyMetrics.summaryTitle}</CardTitle>
        <p className="text-xs text-muted-foreground">{messages.monthlyMetrics.summaryHint}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 3 Input Fields */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {messages.monthlyMetrics.totalVisits}
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={totalVisits}
                onChange={(e) => setTotalVisits(e.target.value)}
                placeholder="0"
                className="text-right"
              />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitPersons}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {messages.monthlyMetrics.totalRevenue}
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={totalRevenue}
                onChange={(e) => setTotalRevenue(e.target.value)}
                placeholder="0"
                className="text-right"
              />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitMan}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {messages.monthlyMetrics.selfPayRevenue}
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={selfPayRevenue}
                onChange={(e) => setSelfPayRevenue(e.target.value)}
                placeholder="0"
                className="text-right"
              />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitMan}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || !hasInput}
            size="sm"
          >
            {saved ? (
              <><Check className="mr-1 h-4 w-4" />{messages.common.saved}</>
            ) : saving ? (
              messages.monthlyMetrics.saving
            ) : (
              <><Save className="mr-1 h-4 w-4" />{messages.monthlyMetrics.saveSummary}</>
            )}
          </Button>
        </div>

        {/* Derived Metrics */}
        {hasInput && (
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              {messages.monthlyMetrics.derivedTitle}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {derivedMetrics.map((m) => (
                <div key={m.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold">
                    {m.value != null ? m.format(m.value) : "-"}
                    <DerivedDelta current={m.value} prev={m.prev} />
                  </p>
                  {m.detail && (
                    <p className="text-xs text-muted-foreground">{m.detail}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
