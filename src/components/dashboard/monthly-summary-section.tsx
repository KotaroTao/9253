"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown, Check, AlertTriangle, Loader2 } from "lucide-react"

interface MonthlySummary {
  totalVisits: number | null
  totalRevenue: number | null
  selfPayRevenue: number | null
  returnVisitRate: number | null
  googleReviewCount: number | null
  googleReviewRating: number | null
}

interface SurveyQuality {
  lowScoreCount: number
  lowScoreQuestions: Array<{ text: string; avgScore: number }>
}

interface MonthlySummarySectionProps {
  year: number
  month: number
  initialSummary: MonthlySummary | null
  prevSummary: MonthlySummary | null
  surveyCount: number
  surveyQuality: SurveyQuality | null
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
  surveyQuality,
}: MonthlySummarySectionProps) {
  const [totalVisits, setTotalVisits] = useState(initialSummary?.totalVisits?.toString() ?? "")
  const [totalRevenue, setTotalRevenue] = useState(initialSummary?.totalRevenue?.toString() ?? "")
  const [selfPayRevenue, setSelfPayRevenue] = useState(initialSummary?.selfPayRevenue?.toString() ?? "")
  const [returnVisitRate, setReturnVisitRate] = useState(initialSummary?.returnVisitRate?.toString() ?? "")
  const [reviewCount, setReviewCount] = useState(initialSummary?.googleReviewCount?.toString() ?? "")
  const [reviewRating, setReviewRating] = useState(initialSummary?.googleReviewRating?.toString() ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    setTotalVisits(initialSummary?.totalVisits?.toString() ?? "")
    setTotalRevenue(initialSummary?.totalRevenue?.toString() ?? "")
    setSelfPayRevenue(initialSummary?.selfPayRevenue?.toString() ?? "")
    setReturnVisitRate(initialSummary?.returnVisitRate?.toString() ?? "")
    setReviewCount(initialSummary?.googleReviewCount?.toString() ?? "")
    setReviewRating(initialSummary?.googleReviewRating?.toString() ?? "")
    setSaved(false)
    isInitialMount.current = true
  }, [year, month, initialSummary])

  const visits = totalVisits ? parseInt(totalVisits) : null
  const revenue = totalRevenue ? parseInt(totalRevenue) : null
  const selfPay = selfPayRevenue ? parseInt(selfPayRevenue) : null
  const gReviewCount = reviewCount ? parseInt(reviewCount) : null

  const doSave = useCallback(async () => {
    const v = totalVisits ? parseInt(totalVisits) : null
    const r = totalRevenue ? parseInt(totalRevenue) : null
    const sp = selfPayRevenue ? parseInt(selfPayRevenue) : null
    const rvr = returnVisitRate ? parseFloat(returnVisitRate) : null
    const rc = reviewCount ? parseInt(reviewCount) : null
    const rr = reviewRating ? parseFloat(reviewRating) : null
    if (v == null && r == null && sp == null && rvr == null && rc == null && rr == null) return

    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/monthly-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year, month,
          totalVisits: v,
          totalRevenue: r,
          selfPayRevenue: sp,
          returnVisitRate: rvr,
          googleReviewCount: rc,
          googleReviewRating: rr,
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
  }, [year, month, totalVisits, totalRevenue, selfPayRevenue, returnVisitRate, reviewCount, reviewRating])

  // Auto-save 1.5s after any input change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { doSave() }, 1500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [totalVisits, totalRevenue, selfPayRevenue, returnVisitRate, reviewCount, reviewRating, doSave])

  // Derived metrics
  const surveyResponseRate = visits != null && visits > 0 ? Math.round((surveyCount / visits) * 1000) / 10 : null
  const selfPayRatio = revenue != null && revenue > 0 && selfPay != null ? Math.round((selfPay / revenue) * 1000) / 10 : null
  const revenuePerVisit = visits != null && visits > 0 && revenue != null ? Math.round((revenue / visits) * 10) / 10 : null
  const insuranceRevenue = revenue != null && selfPay != null ? revenue - selfPay : null

  // Previous month derived
  const prevRevenue = prevSummary?.totalRevenue
  const prevSelfPay = prevSummary?.selfPayRevenue
  const prevVisits = prevSummary?.totalVisits
  const prevSelfPayRatio = prevRevenue != null && prevRevenue > 0 && prevSelfPay != null ? Math.round((prevSelfPay / prevRevenue) * 1000) / 10 : null
  const prevRevenuePerVisit = prevVisits != null && prevVisits > 0 && prevRevenue != null ? Math.round((prevRevenue / prevVisits) * 10) / 10 : null

  const rvRate = returnVisitRate ? parseFloat(returnVisitRate) : null
  const hasInput = visits != null || revenue != null || selfPay != null || rvRate != null || gReviewCount != null

  const derivedMetrics = [
    { label: messages.monthlyMetrics.surveyResponseRate, value: surveyResponseRate, format: (v: number) => `${v}%`, detail: surveyCount > 0 ? `(${surveyCount}/${visits})` : null, prev: null as number | null },
    { label: messages.monthlyMetrics.selfPayRatio, value: selfPayRatio, format: (v: number) => `${v}%`, detail: selfPay != null && revenue != null ? `(${selfPay}/${revenue})` : null, prev: prevSelfPayRatio },
    { label: messages.monthlyMetrics.revenuePerVisit, value: revenuePerVisit, format: (v: number) => `${v}${messages.monthlyMetrics.unitMan}`, detail: null, prev: prevRevenuePerVisit },
    { label: messages.monthlyMetrics.insuranceRevenue, value: insuranceRevenue, format: (v: number) => `${v}${messages.monthlyMetrics.unitMan}`, detail: null, prev: prevRevenue != null && prevSelfPay != null ? prevRevenue - prevSelfPay : null },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{messages.monthlyMetrics.summaryTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{messages.monthlyMetrics.summaryHint}</p>
          </div>
          {/* Auto-save status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saving && (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />{messages.monthlyMetrics.saving}</>
            )}
            {saved && !saving && (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />{messages.monthlyMetrics.autoSaved}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Input fields */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{messages.monthlyMetrics.totalVisits}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={totalVisits} onChange={(e) => setTotalVisits(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitPersons}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{messages.monthlyMetrics.totalRevenue}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={totalRevenue} onChange={(e) => setTotalRevenue(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitMan}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{messages.monthlyMetrics.selfPayRevenue}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={selfPayRevenue} onChange={(e) => setSelfPayRevenue(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitMan}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{messages.monthlyMetrics.returnVisitRate}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} max={100} step={0.1} value={returnVisitRate} onChange={(e) => setReturnVisitRate(e.target.value)} placeholder="0.0" className="text-right" />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitPercent}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{messages.monthlyMetrics.googleReviewCount}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={reviewCount} onChange={(e) => setReviewCount(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitReviews}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{messages.monthlyMetrics.googleReviewRating}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} max={5} step={0.1} value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} placeholder="0.0" className="text-right" />
              <span className="text-sm text-muted-foreground">{messages.monthlyMetrics.unitPoints}</span>
            </div>
          </div>
        </div>

        {/* Low score alert with question details */}
        {surveyQuality && (surveyQuality.lowScoreCount > 0 || surveyQuality.lowScoreQuestions.length > 0) && (
          <div className="space-y-2">
            {surveyQuality.lowScoreCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  {messages.monthlyMetrics.lowScoreAlert}: {surveyQuality.lowScoreCount}{messages.monthlyMetrics.lowScoreCount}
                </span>
              </div>
            )}
            {surveyQuality.lowScoreQuestions.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-700 mb-1.5">{messages.monthlyMetrics.lowScoreItems}</p>
                <ul className="space-y-0.5">
                  {surveyQuality.lowScoreQuestions.map((q) => (
                    <li key={q.text} className="flex items-center justify-between text-sm text-amber-800">
                      <span>・{q.text}</span>
                      <span className="ml-2 font-medium tabular-nums">{q.avgScore}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Derived Metrics */}
        {hasInput && (
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">{messages.monthlyMetrics.derivedTitle}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {derivedMetrics.map((m) => (
                <div key={m.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold">
                    {m.value != null ? m.format(m.value) : "-"}
                    <DerivedDelta current={m.value} prev={m.prev} />
                  </p>
                  {m.detail && <p className="text-xs text-muted-foreground">{m.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
