"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown, Check, Loader2 } from "lucide-react"

export interface MonthlySummary {
  firstVisitCount: number | null
  revisitCount: number | null
  insuranceRevenue: number | null
  selfPayRevenue: number | null
  cancellationCount: number | null
}

interface MonthlySummarySectionProps {
  year: number
  month: number
  initialSummary: MonthlySummary | null
  prevSummary: MonthlySummary | null
  surveyCount: number
}

function DerivedDelta({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) return null
  const isUp = diff > 0
  return (
    <span className={`ml-1 text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}>
      {isUp ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
      {" "}{isUp ? "+" : ""}{diff}
    </span>
  )
}

export function calcDerived(s: MonthlySummary | null, surveyCount: number) {
  if (!s) return null
  const first = s.firstVisitCount
  const revisit = s.revisitCount
  const totalPatients = first != null && revisit != null ? first + revisit : null
  const insRev = s.insuranceRevenue
  const spRev = s.selfPayRevenue
  const totalRevenue = insRev != null && spRev != null ? insRev + spRev : null
  const cancel = s.cancellationCount

  return {
    totalPatients,
    revenuePerVisit: totalPatients != null && totalPatients > 0 && totalRevenue != null
      ? Math.round((totalRevenue / totalPatients) * 10) / 10 : null,
    selfPayRatioAmount: totalRevenue != null && totalRevenue > 0 && spRev != null
      ? Math.round((spRev / totalRevenue) * 1000) / 10 : null,
    returnRate: totalPatients != null && totalPatients > 0 && revisit != null
      ? Math.round((revisit / totalPatients) * 1000) / 10 : null,
    newPatientRate: totalPatients != null && totalPatients > 0 && first != null
      ? Math.round((first / totalPatients) * 1000) / 10 : null,
    cancellationRate: totalPatients != null && totalPatients > 0 && cancel != null
      ? Math.round((cancel / (totalPatients + cancel)) * 1000) / 10 : null,
    surveyResponseRate: totalPatients != null && totalPatients > 0
      ? Math.round((surveyCount / totalPatients) * 1000) / 10 : null,
  }
}

export function MonthlySummarySection({
  year,
  month,
  initialSummary,
  prevSummary,
  surveyCount,
}: MonthlySummarySectionProps) {
  const [firstVisitCount, setFirstVisitCount] = useState(initialSummary?.firstVisitCount?.toString() ?? "")
  const [revisitCount, setRevisitCount] = useState(initialSummary?.revisitCount?.toString() ?? "")
  const [insuranceRevenue, setInsuranceRevenue] = useState(initialSummary?.insuranceRevenue?.toString() ?? "")
  const [selfPayRevenue, setSelfPayRevenue] = useState(initialSummary?.selfPayRevenue?.toString() ?? "")
  const [cancellationCount, setCancellationCount] = useState(initialSummary?.cancellationCount?.toString() ?? "")

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    setFirstVisitCount(initialSummary?.firstVisitCount?.toString() ?? "")
    setRevisitCount(initialSummary?.revisitCount?.toString() ?? "")
    setInsuranceRevenue(initialSummary?.insuranceRevenue?.toString() ?? "")
    setSelfPayRevenue(initialSummary?.selfPayRevenue?.toString() ?? "")
    setCancellationCount(initialSummary?.cancellationCount?.toString() ?? "")
    setSaved(false)
    isInitialMount.current = true
  }, [year, month, initialSummary])

  const toInt = (v: string) => v ? parseInt(v) : null

  const doSave = useCallback(async () => {
    const payload = {
      year, month,
      firstVisitCount: toInt(firstVisitCount),
      revisitCount: toInt(revisitCount),
      insuranceRevenue: toInt(insuranceRevenue),
      selfPayRevenue: toInt(selfPayRevenue),
      cancellationCount: toInt(cancellationCount),
    }
    // Don't save if all fields are empty
    if (Object.entries(payload).every(([k, v]) => k === "year" || k === "month" || v == null)) return

    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/monthly-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
  }, [year, month, firstVisitCount, revisitCount, insuranceRevenue, selfPayRevenue, cancellationCount])

  // Auto-save 1.5s after any input change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { doSave() }, 1500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [firstVisitCount, revisitCount, insuranceRevenue, selfPayRevenue, cancellationCount, doSave])

  // Build current summary for derived calcs
  const currentSummary: MonthlySummary = {
    firstVisitCount: toInt(firstVisitCount),
    revisitCount: toInt(revisitCount),
    insuranceRevenue: toInt(insuranceRevenue),
    selfPayRevenue: toInt(selfPayRevenue),
    cancellationCount: toInt(cancellationCount),
  }

  const derived = calcDerived(currentSummary, surveyCount)
  const prevDerived = calcDerived(prevSummary, 0)

  const hasInput = Object.values(currentSummary).some((v) => v != null)

  const m = messages.monthlyMetrics

  const derivedMetrics = derived ? [
    { label: m.totalPatients, value: derived.totalPatients, format: (v: number) => `${v}${m.unitPersons}`, prev: prevDerived?.totalPatients ?? null },
    { label: m.revenuePerVisit, value: derived.revenuePerVisit, format: (v: number) => `${v}${m.unitMan}`, prev: prevDerived?.revenuePerVisit ?? null },
    { label: m.selfPayRatioAmount, value: derived.selfPayRatioAmount, format: (v: number) => `${v}%`, prev: prevDerived?.selfPayRatioAmount ?? null },
    { label: m.returnRate, value: derived.returnRate, format: (v: number) => `${v}%`, prev: prevDerived?.returnRate ?? null },
    { label: m.newPatientRate, value: derived.newPatientRate, format: (v: number) => `${v}%`, prev: prevDerived?.newPatientRate ?? null },
    { label: m.cancellationRate, value: derived.cancellationRate, format: (v: number) => `${v}%`, prev: prevDerived?.cancellationRate ?? null },
    { label: m.surveyResponseRate, value: derived.surveyResponseRate, format: (v: number) => `${v}%`, prev: null as number | null },
  ] : []

  return (
    <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-slate-100">{m.summaryTitle}</CardTitle>
            <p className="text-xs text-slate-400">{m.summaryHint}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {saving && (
              <span className="text-slate-400"><Loader2 className="inline h-3.5 w-3.5 animate-spin" /> {m.saving}</span>
            )}
            {saved && !saving && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />{m.autoSaved}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Input fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 初診実人数 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{m.firstVisitCount}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={firstVisitCount} onChange={(e) => setFirstVisitCount(e.target.value)} placeholder="0" className="border-slate-600 bg-slate-800/80 text-right text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:ring-slate-500" />
              <span className="text-sm text-slate-500">{m.unitPersons}</span>
            </div>
          </div>

          {/* 再診実人数 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{m.revisitCount}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={revisitCount} onChange={(e) => setRevisitCount(e.target.value)} placeholder="0" className="border-slate-600 bg-slate-800/80 text-right text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:ring-slate-500" />
              <span className="text-sm text-slate-500">{m.unitPersons}</span>
            </div>
          </div>

          {/* 保険売上 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{m.insuranceRevenue}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={insuranceRevenue} onChange={(e) => setInsuranceRevenue(e.target.value)} placeholder="0" className="border-slate-600 bg-slate-800/80 text-right text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:ring-slate-500" />
              <span className="text-sm text-slate-500">{m.unitMan}</span>
            </div>
          </div>

          {/* 自費売上 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{m.selfPayRevenue}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={selfPayRevenue} onChange={(e) => setSelfPayRevenue(e.target.value)} placeholder="0" className="border-slate-600 bg-slate-800/80 text-right text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:ring-slate-500" />
              <span className="text-sm text-slate-500">{m.unitMan}</span>
            </div>
          </div>

          {/* キャンセル件数 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{m.cancellationCount}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={cancellationCount} onChange={(e) => setCancellationCount(e.target.value)} placeholder="0" className="border-slate-600 bg-slate-800/80 text-right text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:ring-slate-500" />
              <span className="text-sm text-slate-500">{m.unitCount}</span>
            </div>
          </div>
        </div>

        {/* Derived KPIs */}
        {hasInput && derived && (
          <div>
            <p className="mb-3 text-xs font-medium text-slate-400">{m.derivedTitle}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {derivedMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-3">
                  <p className="text-xs text-slate-400">{metric.label}</p>
                  <p className="text-lg font-bold text-slate-100">
                    {metric.value != null ? metric.format(metric.value) : "-"}
                    <DerivedDelta current={metric.value} prev={metric.prev} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
