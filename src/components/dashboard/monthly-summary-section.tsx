"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown, Check, Loader2, HelpCircle, X } from "lucide-react"
import { calcDerived, calcProfileDerived, getBenchmarkStatus } from "@/lib/metrics-utils"
import type { MonthlySummary, ClinicProfile, BenchmarkStatus, ClinicType } from "@/lib/metrics-utils"

interface ProfileDefaults {
  chairCount: number | null
  dentistCount: number | null
  hygienistCount: number | null
}

interface MonthlySummarySectionProps {
  year: number
  month: number
  initialSummary: MonthlySummary | null
  prevSummary: MonthlySummary | null
  surveyCount: number
  initialProfile: ClinicProfile | null
  prevProfile: ClinicProfile | null
  autoWorkingDays: number
  profileDefaults: ProfileDefaults
  clinicType?: ClinicType
}

function DerivedDelta({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) return null
  const isUp = diff > 0
  return (
    <span className={`ml-1 text-xs ${isUp ? "text-emerald-600" : "text-red-500"}`}>
      {isUp ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
      {" "}{isUp ? "+" : ""}{diff}
    </span>
  )
}

type KpiHelpKey = keyof typeof messages.monthlyMetrics.kpiHelp

function KpiHelpButton({ helpKey }: { helpKey?: KpiHelpKey }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  if (!helpKey) return null
  const help = messages.monthlyMetrics.kpiHelp[helpKey]
  if (!help) return null

  return (
    <span className="relative inline-block align-middle" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="ml-1 inline-flex items-center text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        aria-label="指標の説明"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-56 rounded-lg border bg-popover p-3 shadow-lg text-left">
          <div className="flex items-start justify-between gap-1">
            <p className="text-xs text-popover-foreground leading-relaxed">{help.desc}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            <span className="font-medium">目安:</span> {help.benchmark}
          </p>
        </div>
      )}
    </span>
  )
}

function NumberInput({
  label, value, onChange, unit, step, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; unit: string
  step?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={`text-right ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">{unit}</span>
      </div>
    </div>
  )
}

export function MonthlySummarySection({
  year,
  month,
  initialSummary,
  prevSummary,
  surveyCount,
  initialProfile,
  prevProfile,
  autoWorkingDays,
  profileDefaults,
  clinicType,
}: MonthlySummarySectionProps) {
  // Summary input state
  const [totalVisitCount, setTotalVisitCount] = useState(initialProfile?.totalVisitCount?.toString() ?? "")
  const [totalPatientCount, setTotalPatientCount] = useState(initialSummary?.totalPatientCount?.toString() ?? "")
  const [firstVisitCount, setFirstVisitCount] = useState(initialSummary?.firstVisitCount?.toString() ?? "")
  const [revisitCount, setRevisitCount] = useState(initialSummary?.revisitCount?.toString() ?? "")
  const [totalRevenue, setTotalRevenue] = useState(initialSummary?.totalRevenue?.toString() ?? "")
  const [insuranceRevenue, setInsuranceRevenue] = useState(initialSummary?.insuranceRevenue?.toString() ?? "")
  const [selfPayRevenue, setSelfPayRevenue] = useState(initialSummary?.selfPayRevenue?.toString() ?? "")
  const [cancellationCount, setCancellationCount] = useState(initialSummary?.cancellationCount?.toString() ?? "")
  const [workingDays, setWorkingDays] = useState(
    initialProfile?.workingDays?.toString() ?? autoWorkingDays.toString()
  )

  // Profile input state (semi-static)
  const [chairCount, setChairCount] = useState(
    initialProfile?.chairCount?.toString() ?? profileDefaults.chairCount?.toString() ?? ""
  )
  const [dentistCount, setDentistCount] = useState(
    initialProfile?.dentistCount?.toString() ?? profileDefaults.dentistCount?.toString() ?? ""
  )
  const [hygienistCount, setHygienistCount] = useState(
    initialProfile?.hygienistCount?.toString() ?? profileDefaults.hygienistCount?.toString() ?? ""
  )
  const [laborCost, setLaborCost] = useState(initialProfile?.laborCost?.toString() ?? "")

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    setTotalVisitCount(initialProfile?.totalVisitCount?.toString() ?? "")
    setTotalPatientCount(initialSummary?.totalPatientCount?.toString() ?? "")
    setFirstVisitCount(initialSummary?.firstVisitCount?.toString() ?? "")
    setRevisitCount(initialSummary?.revisitCount?.toString() ?? "")
    setTotalRevenue(initialSummary?.totalRevenue?.toString() ?? "")
    setInsuranceRevenue(initialSummary?.insuranceRevenue?.toString() ?? "")
    setSelfPayRevenue(initialSummary?.selfPayRevenue?.toString() ?? "")
    setCancellationCount(initialSummary?.cancellationCount?.toString() ?? "")
    setWorkingDays(initialProfile?.workingDays?.toString() ?? autoWorkingDays.toString())

    setChairCount(initialProfile?.chairCount?.toString() ?? profileDefaults.chairCount?.toString() ?? "")
    setDentistCount(initialProfile?.dentistCount?.toString() ?? profileDefaults.dentistCount?.toString() ?? "")
    setHygienistCount(initialProfile?.hygienistCount?.toString() ?? profileDefaults.hygienistCount?.toString() ?? "")
    setLaborCost(initialProfile?.laborCost?.toString() ?? "")

    setSaved(false)
    isInitialMount.current = true
  }, [year, month, initialSummary, initialProfile, autoWorkingDays, profileDefaults])

  const toInt = (v: string) => v ? parseInt(v) : null
  const toFloat = (v: string) => v ? parseFloat(v) : null

  const doSave = useCallback(async () => {
    const payload = {
      year, month,
      totalPatientCount: toInt(totalPatientCount),
      firstVisitCount: toInt(firstVisitCount),
      revisitCount: toInt(revisitCount),
      totalRevenue: toInt(totalRevenue),
      insuranceRevenue: toInt(insuranceRevenue),
      selfPayRevenue: toInt(selfPayRevenue),
      cancellationCount: toInt(cancellationCount),
      chairCount: toInt(chairCount),
      dentistCount: toFloat(dentistCount),
      hygienistCount: toFloat(hygienistCount),
      totalVisitCount: toInt(totalVisitCount),
      workingDays: toInt(workingDays),
      laborCost: toInt(laborCost),
    }
    const valueKeys = Object.keys(payload).filter((k) => k !== "year" && k !== "month")
    if (valueKeys.every((k) => (payload as Record<string, unknown>)[k] == null)) return

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
  }, [year, month, totalPatientCount, firstVisitCount, revisitCount, totalRevenue,
    insuranceRevenue, selfPayRevenue, cancellationCount,
    chairCount, dentistCount, hygienistCount, totalVisitCount, workingDays, laborCost])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { doSave() }, 1500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [totalPatientCount, firstVisitCount, revisitCount, totalRevenue,
    insuranceRevenue, selfPayRevenue, cancellationCount,
    chairCount, dentistCount, hygienistCount, totalVisitCount, workingDays, laborCost, doSave])

  // --- Auto-calc helpers for paired fields ---
  const autoCalcStr = (total: string, part: string) => {
    const t = parseInt(total)
    const p = parseInt(part)
    if (!isNaN(t) && !isNaN(p)) {
      const r = t - p
      return r >= 0 ? r.toString() : "0"
    }
    return ""
  }

  const handleTotalPatientCount = (v: string) => {
    setTotalPatientCount(v)
    if (v && firstVisitCount) {
      setRevisitCount(autoCalcStr(v, firstVisitCount))
    } else if (v && revisitCount) {
      setFirstVisitCount(autoCalcStr(v, revisitCount))
    }
  }
  const handleFirstVisitCount = (v: string) => {
    setFirstVisitCount(v)
    if (totalPatientCount) setRevisitCount(autoCalcStr(totalPatientCount, v))
  }
  const handleRevisitCount = (v: string) => {
    setRevisitCount(v)
    if (totalPatientCount) setFirstVisitCount(autoCalcStr(totalPatientCount, v))
  }

  const handleTotalRevenue = (v: string) => {
    setTotalRevenue(v)
    if (v && insuranceRevenue) {
      setSelfPayRevenue(autoCalcStr(v, insuranceRevenue))
    } else if (v && selfPayRevenue) {
      setInsuranceRevenue(autoCalcStr(v, selfPayRevenue))
    }
  }
  const handleInsuranceRevenue = (v: string) => {
    setInsuranceRevenue(v)
    if (totalRevenue) setSelfPayRevenue(autoCalcStr(totalRevenue, v))
  }
  const handleSelfPayRevenue = (v: string) => {
    setSelfPayRevenue(v)
    if (totalRevenue) setInsuranceRevenue(autoCalcStr(totalRevenue, v))
  }

  const patientSubDisabled = !totalPatientCount
  const revenueSubDisabled = !totalRevenue

  // Build current summary for derived calcs
  const currentSummary: MonthlySummary = {
    totalPatientCount: toInt(totalPatientCount),
    firstVisitCount: toInt(firstVisitCount),
    revisitCount: toInt(revisitCount),
    totalRevenue: toInt(totalRevenue),
    insuranceRevenue: toInt(insuranceRevenue),
    selfPayRevenue: toInt(selfPayRevenue),
    cancellationCount: toInt(cancellationCount),
  }

  const currentProfile: ClinicProfile = {
    chairCount: toInt(chairCount),
    dentistCount: toFloat(dentistCount),
    hygienistCount: toFloat(hygienistCount),
    totalVisitCount: toInt(totalVisitCount),
    workingDays: toInt(workingDays),
    laborCost: toInt(laborCost),
  }

  const derived = calcDerived(currentSummary, surveyCount)
  const prevDerived = calcDerived(prevSummary, 0)
  const profileDerived = calcProfileDerived(currentSummary, currentProfile)
  const prevProfileDerived = calcProfileDerived(prevSummary, prevProfile)

  const m = messages.monthlyMetrics

  // Derived KPIs (totalPatients removed — now a direct input)
  const derivedMetrics: { label: string; value: number | null; format: (v: number) => string; prev: number | null; helpKey?: KpiHelpKey; benchmarkKey?: string }[] = [
    { label: m.revenuePerVisit, value: derived?.revenuePerVisit ?? null, format: (v: number) => `${v}${m.unitMan}`, prev: prevDerived?.revenuePerVisit ?? null, helpKey: "revenuePerVisit", benchmarkKey: "revenuePerVisit" },
    { label: m.selfPayRatioAmount, value: derived?.selfPayRatioAmount ?? null, format: (v: number) => `${v}%`, prev: prevDerived?.selfPayRatioAmount ?? null, helpKey: "selfPayRatioAmount", benchmarkKey: "selfPayRatioAmount" },
    { label: m.returnRate, value: derived?.returnRate ?? null, format: (v: number) => `${v}%`, prev: prevDerived?.returnRate ?? null, helpKey: "returnRate", benchmarkKey: "returnRate" },
    { label: m.newPatientRate, value: derived?.newPatientRate ?? null, format: (v: number) => `${v}%`, prev: prevDerived?.newPatientRate ?? null, helpKey: "newPatientRate", benchmarkKey: "newPatientRate" },
    { label: m.cancellationRate, value: derived?.cancellationRate ?? null, format: (v: number) => `${v}%`, prev: prevDerived?.cancellationRate ?? null, helpKey: "cancellationRate", benchmarkKey: "cancellationRate" },
    { label: m.surveyResponseRate, value: derived?.surveyResponseRate ?? null, format: (v: number) => `${v}%`, prev: null as number | null, helpKey: "surveyResponseRate" },
  ]

  // Extended profile-based KPIs (+ revenuePerChair)
  const extendedMetrics: { label: string; value: number | null; format: (v: number) => string; prev: number | null; helpKey?: KpiHelpKey; benchmarkKey?: string }[] = [
    { label: m.dailyPatients, value: profileDerived?.dailyPatients ?? null, format: (v: number) => `${v}${m.unitVisitsPerDay}`, prev: prevProfileDerived?.dailyPatients ?? null, helpKey: "dailyPatients" },
    { label: m.dailyRevenue, value: profileDerived?.dailyRevenue ?? null, format: (v: number) => `${v}${m.unitMan}`, prev: prevProfileDerived?.dailyRevenue ?? null, helpKey: "dailyRevenue" },
    { label: m.chairDailyVisits, value: profileDerived?.chairDailyVisits ?? null, format: (v: number) => `${v}${m.unitVisitsPerChairDay}`, prev: prevProfileDerived?.chairDailyVisits ?? null, helpKey: "chairDailyVisits" },
    { label: m.revenuePerChair, value: profileDerived?.revenuePerChair ?? null, format: (v: number) => `${v}${m.unitMan}`, prev: prevProfileDerived?.revenuePerChair ?? null, helpKey: "revenuePerChair" },
    { label: m.revenuePerReceipt, value: profileDerived?.revenuePerReceipt ?? null, format: (v: number) => `${v}${m.unitMan}`, prev: prevProfileDerived?.revenuePerReceipt ?? null, helpKey: "revenuePerReceipt" },
    { label: m.avgVisitsPerPatient, value: profileDerived?.avgVisitsPerPatient ?? null, format: (v: number) => `${v}${m.unitTimes}`, prev: prevProfileDerived?.avgVisitsPerPatient ?? null, helpKey: "avgVisitsPerPatient" },
    { label: m.revenuePerDentist, value: profileDerived?.revenuePerDentist ?? null, format: (v: number) => `${v}${m.unitMan}`, prev: prevProfileDerived?.revenuePerDentist ?? null, helpKey: "revenuePerDentist" },
    { label: m.patientsPerDentist, value: profileDerived?.patientsPerDentist ?? null, format: (v: number) => `${v}${m.unitPersons}`, prev: prevProfileDerived?.patientsPerDentist ?? null, helpKey: "patientsPerDentist" },
    { label: m.patientsPerHygienist, value: profileDerived?.patientsPerHygienist ?? null, format: (v: number) => `${v}${m.unitPersons}`, prev: prevProfileDerived?.patientsPerHygienist ?? null, helpKey: "patientsPerHygienist" },
    { label: m.laborCostRatio, value: profileDerived?.laborCostRatio ?? null, format: (v: number) => `${v}%`, prev: prevProfileDerived?.laborCostRatio ?? null, helpKey: "laborCostRatio", benchmarkKey: "laborCostRatio" },
    { label: m.revenuePerStaff, value: profileDerived?.revenuePerStaff ?? null, format: (v: number) => `${v}${m.unitMan}`, prev: prevProfileDerived?.revenuePerStaff ?? null, helpKey: "revenuePerStaff" },
  ]

  const visibleExtendedMetrics = extendedMetrics.filter((metric) => metric.value != null)

  return (
    <div className="space-y-4">
      {/* 月次サマリー入力カード */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{m.summaryTitle}</CardTitle>
            <div className="flex items-center gap-1.5 text-xs">
              {saving && (
                <span className="text-muted-foreground"><Loader2 className="inline h-3.5 w-3.5 animate-spin" /> {m.saving}</span>
              )}
              {saved && !saving && (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />{m.autoSaved}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 延べ来院数 → キャンセル件数 → 診療日数 (3 columns on PC) */}
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput label={m.totalVisitCount} value={totalVisitCount} onChange={setTotalVisitCount} unit={m.unitCount} />
            <NumberInput label={m.cancellationCount} value={cancellationCount} onChange={setCancellationCount} unit={m.unitCount} />
            <NumberInput label={m.workingDays} value={workingDays} onChange={setWorkingDays} unit={m.unitDays} />
          </div>

          {/* 総実人数 → 初診 → 再診 (3 columns on PC) */}
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput label={m.totalPatientCount} value={totalPatientCount} onChange={handleTotalPatientCount} unit={m.unitPersons} />
            <NumberInput label={m.firstVisitCount} value={firstVisitCount} onChange={handleFirstVisitCount} unit={m.unitPersons} disabled={patientSubDisabled} />
            <NumberInput label={m.revisitCount} value={revisitCount} onChange={handleRevisitCount} unit={m.unitPersons} disabled={patientSubDisabled} />
          </div>

          {/* 総売上 → 保険 → 自費 (3 columns on PC) */}
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput label={m.totalRevenue} value={totalRevenue} onChange={handleTotalRevenue} unit={m.unitMan} />
            <NumberInput label={m.insuranceRevenue} value={insuranceRevenue} onChange={handleInsuranceRevenue} unit={m.unitMan} disabled={revenueSubDisabled} />
            <NumberInput label={m.selfPayRevenue} value={selfPayRevenue} onChange={handleSelfPayRevenue} unit={m.unitMan} disabled={revenueSubDisabled} />
          </div>
        </CardContent>
      </Card>

      {/* 医院体制カード (semi-static only) */}
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle className="text-base">{m.clinicProfileTitle}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{m.clinicProfileHint}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberInput label={m.chairCount} value={chairCount} onChange={setChairCount} unit={m.unitChairs} step="1" />
            <NumberInput label={m.dentistCount} value={dentistCount} onChange={setDentistCount} unit={m.unitPersons} step="0.5" />
            <NumberInput label={m.hygienistCount} value={hygienistCount} onChange={setHygienistCount} unit={m.unitPersons} step="0.5" />
            <NumberInput label={m.laborCost} value={laborCost} onChange={setLaborCost} unit={m.unitMan} step="1" />
          </div>
        </CardContent>
      </Card>

      {/* 自動算出指標 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{m.derivedTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {derivedMetrics.map((metric) => {
              const status: BenchmarkStatus | null = metric.benchmarkKey ? getBenchmarkStatus(metric.benchmarkKey, metric.value, clinicType) : null
              return (
                <div key={metric.label} className={`rounded-lg border p-3 ${
                  status === "good" ? "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-900/30" :
                  status === "warning" ? "bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30" :
                  status === "danger" ? "bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-900/30" :
                  "bg-muted/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {metric.label}
                      <KpiHelpButton helpKey={metric.helpKey} />
                    </p>
                    {status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        status === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                        status === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      }`}>
                        {status === "good" ? m.statusGood : status === "warning" ? m.statusWarning : m.statusDanger}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold">
                    {metric.value != null ? metric.format(metric.value) : <span className="text-muted-foreground/50">-</span>}
                    <DerivedDelta current={metric.value} prev={metric.prev} />
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 体制・生産性指標 */}
      {visibleExtendedMetrics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{m.extendedDerivedTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {visibleExtendedMetrics.map((metric) => {
                const status: BenchmarkStatus | null = metric.benchmarkKey ? getBenchmarkStatus(metric.benchmarkKey, metric.value, clinicType) : null
                return (
                  <div key={metric.label} className={`rounded-lg border p-3 ${
                    status === "good" ? "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-900/30" :
                    status === "warning" ? "bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30" :
                    status === "danger" ? "bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-900/30" :
                    "bg-muted/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {metric.label}
                        <KpiHelpButton helpKey={metric.helpKey} />
                      </p>
                      {status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          status === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                          status === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        }`}>
                          {status === "good" ? m.statusGood : status === "warning" ? m.statusWarning : m.statusDanger}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold">
                      {metric.value != null ? metric.format(metric.value) : <span className="text-muted-foreground/50">-</span>}
                      <DerivedDelta current={metric.value} prev={metric.prev} />
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
