"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { messages } from "@/lib/messages"
import { Check, Loader2 } from "lucide-react"
import type { MonthlySummary, ClinicProfile } from "@/lib/metrics-utils"

interface ProfileDefaults {
  chairCount: number | null
  dentistCount: number | null
  hygienistCount: number | null
}

interface MonthlySummarySectionProps {
  year: number
  month: number
  initialSummary: MonthlySummary | null
  initialProfile: ClinicProfile | null
  autoWorkingDays: number
  profileDefaults: ProfileDefaults
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
  initialProfile,
  autoWorkingDays,
  profileDefaults,
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

  const m = messages.monthlyMetrics

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
    </div>
  )
}
