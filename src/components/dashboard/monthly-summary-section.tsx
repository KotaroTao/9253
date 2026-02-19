"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown, Check, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react"

export interface MonthlySummary {
  firstVisitCount: number | null
  firstVisitInsurance: number | null
  firstVisitSelfPay: number | null
  revisitCount: number | null
  revisitInsurance: number | null
  revisitSelfPay: number | null
  totalRevenue: number | null
  insuranceRevenue: number | null
  selfPayRevenue: number | null
  cancellationCount: number | null
}

interface SurveyQuality {
  lowScoreCount: number
  freeTextRate: number | null
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

export function calcDerived(s: MonthlySummary | null, surveyCount: number) {
  if (!s) return null
  const first = s.firstVisitCount
  const revisit = s.revisitCount
  const totalPatients = first != null && revisit != null ? first + revisit : null
  const rev = s.totalRevenue
  const insRev = s.insuranceRevenue
  const spRev = s.selfPayRevenue
  const firstIns = s.firstVisitInsurance
  const firstSp = s.firstVisitSelfPay
  const revisitIns = s.revisitInsurance
  const revisitSp = s.revisitSelfPay
  const cancel = s.cancellationCount

  const totalInsurancePatients = firstIns != null && revisitIns != null ? firstIns + revisitIns : null
  const totalSelfPayPatients = firstSp != null && revisitSp != null ? firstSp + revisitSp : null

  return {
    totalPatients,
    revenuePerVisit: totalPatients != null && totalPatients > 0 && rev != null
      ? Math.round((rev / totalPatients) * 10) / 10 : null,
    revenuePerVisitInsurance: totalInsurancePatients != null && totalInsurancePatients > 0 && insRev != null
      ? Math.round((insRev / totalInsurancePatients) * 10) / 10 : null,
    revenuePerVisitSelfPay: totalSelfPayPatients != null && totalSelfPayPatients > 0 && spRev != null
      ? Math.round((spRev / totalSelfPayPatients) * 10) / 10 : null,
    selfPayRatioAmount: rev != null && rev > 0 && spRev != null
      ? Math.round((spRev / rev) * 1000) / 10 : null,
    selfPayRatioCount: totalPatients != null && totalPatients > 0 && totalSelfPayPatients != null
      ? Math.round((totalSelfPayPatients / totalPatients) * 1000) / 10 : null,
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
  surveyQuality,
}: MonthlySummarySectionProps) {
  // State for all input fields
  const [firstVisitCount, setFirstVisitCount] = useState(initialSummary?.firstVisitCount?.toString() ?? "")
  const [firstVisitInsurance, setFirstVisitInsurance] = useState(initialSummary?.firstVisitInsurance?.toString() ?? "")
  const [firstVisitSelfPay, setFirstVisitSelfPay] = useState(initialSummary?.firstVisitSelfPay?.toString() ?? "")
  const [revisitCount, setRevisitCount] = useState(initialSummary?.revisitCount?.toString() ?? "")
  const [revisitInsurance, setRevisitInsurance] = useState(initialSummary?.revisitInsurance?.toString() ?? "")
  const [revisitSelfPay, setRevisitSelfPay] = useState(initialSummary?.revisitSelfPay?.toString() ?? "")
  const [totalRevenue, setTotalRevenue] = useState(initialSummary?.totalRevenue?.toString() ?? "")
  const [insuranceRevenue, setInsuranceRevenue] = useState(initialSummary?.insuranceRevenue?.toString() ?? "")
  const [selfPayRevenue, setSelfPayRevenue] = useState(initialSummary?.selfPayRevenue?.toString() ?? "")
  const [cancellationCount, setCancellationCount] = useState(initialSummary?.cancellationCount?.toString() ?? "")

  const [showFirstBreakdown, setShowFirstBreakdown] = useState(
    (initialSummary?.firstVisitInsurance ?? null) != null || (initialSummary?.firstVisitSelfPay ?? null) != null
  )
  const [showRevisitBreakdown, setShowRevisitBreakdown] = useState(
    (initialSummary?.revisitInsurance ?? null) != null || (initialSummary?.revisitSelfPay ?? null) != null
  )
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(
    (initialSummary?.insuranceRevenue ?? null) != null || (initialSummary?.selfPayRevenue ?? null) != null
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    setFirstVisitCount(initialSummary?.firstVisitCount?.toString() ?? "")
    setFirstVisitInsurance(initialSummary?.firstVisitInsurance?.toString() ?? "")
    setFirstVisitSelfPay(initialSummary?.firstVisitSelfPay?.toString() ?? "")
    setRevisitCount(initialSummary?.revisitCount?.toString() ?? "")
    setRevisitInsurance(initialSummary?.revisitInsurance?.toString() ?? "")
    setRevisitSelfPay(initialSummary?.revisitSelfPay?.toString() ?? "")
    setTotalRevenue(initialSummary?.totalRevenue?.toString() ?? "")
    setInsuranceRevenue(initialSummary?.insuranceRevenue?.toString() ?? "")
    setSelfPayRevenue(initialSummary?.selfPayRevenue?.toString() ?? "")
    setCancellationCount(initialSummary?.cancellationCount?.toString() ?? "")
    setShowFirstBreakdown(
      (initialSummary?.firstVisitInsurance ?? null) != null || (initialSummary?.firstVisitSelfPay ?? null) != null
    )
    setShowRevisitBreakdown(
      (initialSummary?.revisitInsurance ?? null) != null || (initialSummary?.revisitSelfPay ?? null) != null
    )
    setShowRevenueBreakdown(
      (initialSummary?.insuranceRevenue ?? null) != null || (initialSummary?.selfPayRevenue ?? null) != null
    )
    setSaved(false)
    isInitialMount.current = true
  }, [year, month, initialSummary])

  const toInt = (v: string) => v ? parseInt(v) : null

  const doSave = useCallback(async () => {
    const payload = {
      year, month,
      firstVisitCount: toInt(firstVisitCount),
      firstVisitInsurance: toInt(firstVisitInsurance),
      firstVisitSelfPay: toInt(firstVisitSelfPay),
      revisitCount: toInt(revisitCount),
      revisitInsurance: toInt(revisitInsurance),
      revisitSelfPay: toInt(revisitSelfPay),
      totalRevenue: toInt(totalRevenue),
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
  }, [year, month, firstVisitCount, firstVisitInsurance, firstVisitSelfPay, revisitCount, revisitInsurance, revisitSelfPay, totalRevenue, insuranceRevenue, selfPayRevenue, cancellationCount])

  // Auto-save 1.5s after any input change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { doSave() }, 1500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [firstVisitCount, firstVisitInsurance, firstVisitSelfPay, revisitCount, revisitInsurance, revisitSelfPay, totalRevenue, insuranceRevenue, selfPayRevenue, cancellationCount, doSave])

  // Build current summary for derived calcs
  const currentSummary: MonthlySummary = {
    firstVisitCount: toInt(firstVisitCount),
    firstVisitInsurance: toInt(firstVisitInsurance),
    firstVisitSelfPay: toInt(firstVisitSelfPay),
    revisitCount: toInt(revisitCount),
    revisitInsurance: toInt(revisitInsurance),
    revisitSelfPay: toInt(revisitSelfPay),
    totalRevenue: toInt(totalRevenue),
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
    { label: m.selfPayRatioCount, value: derived.selfPayRatioCount, format: (v: number) => `${v}%`, prev: prevDerived?.selfPayRatioCount ?? null },
    { label: m.returnRate, value: derived.returnRate, format: (v: number) => `${v}%`, prev: prevDerived?.returnRate ?? null },
    { label: m.newPatientRate, value: derived.newPatientRate, format: (v: number) => `${v}%`, prev: prevDerived?.newPatientRate ?? null },
    { label: m.cancellationRate, value: derived.cancellationRate, format: (v: number) => `${v}%`, prev: prevDerived?.cancellationRate ?? null },
    { label: m.surveyResponseRate, value: derived.surveyResponseRate, format: (v: number) => `${v}%`, prev: null as number | null },
  ] : []

  const BreakdownToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
    >
      {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      {m.optionalBreakdown}
    </button>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{m.summaryTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{m.summaryHint}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saving && (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />{m.saving}</>
            )}
            {saved && !saving && (
              <span className="text-green-600 flex items-center gap-1">
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
          <div className="space-y-1.5">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{m.firstVisitCount}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={firstVisitCount} onChange={(e) => setFirstVisitCount(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{m.unitPersons}</span>
            </div>
            <BreakdownToggle open={showFirstBreakdown} onToggle={() => setShowFirstBreakdown(!showFirstBreakdown)} />
            {showFirstBreakdown && (
              <div className="ml-3 grid grid-cols-2 gap-2 border-l-2 border-muted pl-3">
                <div>
                  <label className="block text-[10px] text-muted-foreground">{m.insurance}</label>
                  <Input type="number" min={0} value={firstVisitInsurance} onChange={(e) => setFirstVisitInsurance(e.target.value)} placeholder="0" className="h-8 text-right text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground">{m.selfPay}</label>
                  <Input type="number" min={0} value={firstVisitSelfPay} onChange={(e) => setFirstVisitSelfPay(e.target.value)} placeholder="0" className="h-8 text-right text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* 再診実人数 */}
          <div className="space-y-1.5">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{m.revisitCount}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={revisitCount} onChange={(e) => setRevisitCount(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{m.unitPersons}</span>
            </div>
            <BreakdownToggle open={showRevisitBreakdown} onToggle={() => setShowRevisitBreakdown(!showRevisitBreakdown)} />
            {showRevisitBreakdown && (
              <div className="ml-3 grid grid-cols-2 gap-2 border-l-2 border-muted pl-3">
                <div>
                  <label className="block text-[10px] text-muted-foreground">{m.insurance}</label>
                  <Input type="number" min={0} value={revisitInsurance} onChange={(e) => setRevisitInsurance(e.target.value)} placeholder="0" className="h-8 text-right text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground">{m.selfPay}</label>
                  <Input type="number" min={0} value={revisitSelfPay} onChange={(e) => setRevisitSelfPay(e.target.value)} placeholder="0" className="h-8 text-right text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* 総売上 */}
          <div className="space-y-1.5">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{m.totalRevenue}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={totalRevenue} onChange={(e) => setTotalRevenue(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{m.unitMan}</span>
            </div>
            <BreakdownToggle open={showRevenueBreakdown} onToggle={() => setShowRevenueBreakdown(!showRevenueBreakdown)} />
            {showRevenueBreakdown && (
              <div className="ml-3 grid grid-cols-2 gap-2 border-l-2 border-muted pl-3">
                <div>
                  <label className="block text-[10px] text-muted-foreground">{m.insuranceRevenue}</label>
                  <Input type="number" min={0} value={insuranceRevenue} onChange={(e) => setInsuranceRevenue(e.target.value)} placeholder="0" className="h-8 text-right text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground">{m.selfPayRevenue}</label>
                  <Input type="number" min={0} value={selfPayRevenue} onChange={(e) => setSelfPayRevenue(e.target.value)} placeholder="0" className="h-8 text-right text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* キャンセル件数 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{m.cancellationCount}</label>
            <div className="flex items-center gap-1">
              <Input type="number" min={0} value={cancellationCount} onChange={(e) => setCancellationCount(e.target.value)} placeholder="0" className="text-right" />
              <span className="text-sm text-muted-foreground">{m.unitCount}</span>
            </div>
          </div>
        </div>

        {/* Survey quality alerts */}
        {surveyQuality && (surveyQuality.lowScoreCount > 0 || surveyQuality.freeTextRate != null) && (
          <div className="flex flex-wrap gap-3">
            {surveyQuality.lowScoreCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  {m.lowScoreAlert}: {surveyQuality.lowScoreCount}{m.lowScoreCount}
                </span>
              </div>
            )}
            {surveyQuality.freeTextRate != null && (
              <div className="rounded-lg border px-3 py-2">
                <span className="text-xs text-muted-foreground">{m.freeTextRate}: </span>
                <span className="text-sm font-medium">{surveyQuality.freeTextRate}%</span>
              </div>
            )}
          </div>
        )}

        {/* Derived KPIs */}
        {hasInput && derived && (
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">{m.derivedTitle}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {derivedMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-bold">
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
