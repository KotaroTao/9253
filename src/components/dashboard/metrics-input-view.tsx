"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MonthlySummarySection } from "./monthly-summary-section"
import { getMonthStatus } from "@/lib/metrics-utils"
import type { MonthlySummary, ClinicProfile, MonthStatus } from "@/lib/metrics-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

// 2025年1月から当月までの月リストを生成
function generateMonthOptions(): { year: number; month: number; label: string }[] {
  const now = new Date()
  const startYear = 2025
  const startMonth = 1
  const endYear = now.getFullYear()
  const endMonth = now.getMonth() + 1

  const options: { year: number; month: number; label: string }[] = []
  for (let y = endYear; y >= startYear; y--) {
    const mEnd = y === endYear ? endMonth : 12
    const mStart = y === startYear ? startMonth : 1
    for (let m = mEnd; m >= mStart; m--) {
      options.push({
        year: y,
        month: m,
        label: `${y}年${m}月`,
      })
    }
  }
  return options
}

interface ProfileDefaults {
  chairCount: number | null
  dentistCount: number | null
  hygienistCount: number | null
}

interface MetricsInputViewProps {
  initialSummary: MonthlySummary | null
  initialPrevSummary: MonthlySummary | null
  initialSurveyCount: number
  initialYear: number
  initialMonth: number
  monthStatuses?: Record<string, MonthStatus>
  initialProfile: ClinicProfile | null
  initialPrevProfile: ClinicProfile | null
  initialAutoWorkingDays: number
  initialProfileDefaults: ProfileDefaults
  clinicType?: string
}

export function MetricsInputView({
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialYear,
  initialMonth,
  monthStatuses: initialMonthStatuses = {},
  initialProfile,
  initialPrevProfile,
  initialAutoWorkingDays,
  initialProfileDefaults,
  clinicType,
}: MetricsInputViewProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [loading, setLoading] = useState(false)
  const [monthStatuses, setMonthStatuses] = useState<Record<string, MonthStatus>>(initialMonthStatuses)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(initialYear)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Profile state
  const [profile, setProfile] = useState<ClinicProfile | null>(initialProfile)
  const [prevProfile, setPrevProfile] = useState<ClinicProfile | null>(initialPrevProfile)
  const [autoWorkingDays, setAutoWorkingDays] = useState(initialAutoWorkingDays)
  const [profileDefaults, setProfileDefaults] = useState<ProfileDefaults>(initialProfileDefaults)

  const m = messages.monthlyMetrics

  const monthOptions = useMemo(() => generateMonthOptions(), [])
  const years = useMemo(() => Array.from(new Set(monthOptions.map((o) => o.year))), [monthOptions])

  // Close month picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false)
      }
    }
    if (showMonthPicker) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMonthPicker])

  async function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear)
    setMonth(newMonth)
    setShowMonthPicker(false)
    setLoading(true)

    try {
      const res = await fetch(
        `/api/monthly-metrics?year=${newYear}&month=${newMonth}`
      )
      if (res.ok) {
        const data = await res.json()
        const fetchedSummary = data.summary ?? null
        setSummary(fetchedSummary)
        setPrevSummary(data.prevSummary ?? null)
        setSurveyCount(data.surveyCount ?? 0)
        setAutoWorkingDays(data.autoWorkingDays ?? 0)
        setProfileDefaults(data.profileDefaults ?? { chairCount: null, dentistCount: null, hygienistCount: null })

        // Extract profile from summary
        if (fetchedSummary) {
          setProfile({
            chairCount: fetchedSummary.chairCount ?? null,
            dentistCount: fetchedSummary.dentistCount ?? null,
            hygienistCount: fetchedSummary.hygienistCount ?? null,
            totalVisitCount: fetchedSummary.totalVisitCount ?? null,
            workingDays: fetchedSummary.workingDays ?? null,
            laborCost: fetchedSummary.laborCost ?? null,
          })
        } else {
          setProfile(null)
        }

        // Extract prev profile
        const prev = data.prevSummary
        if (prev) {
          setPrevProfile({
            chairCount: prev.chairCount ?? null,
            dentistCount: prev.dentistCount ?? null,
            hygienistCount: prev.hygienistCount ?? null,
            totalVisitCount: prev.totalVisitCount ?? null,
            workingDays: prev.workingDays ?? null,
            laborCost: prev.laborCost ?? null,
          })
        } else {
          setPrevProfile(null)
        }

        const key = `${newYear}-${newMonth}`
        setMonthStatuses((prev) => ({
          ...prev,
          [key]: getMonthStatus(fetchedSummary),
        }))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Navigate to prev/next month
  function navigateMonth(direction: -1 | 1) {
    const idx = monthOptions.findIndex((o) => o.year === year && o.month === month)
    // monthOptions is sorted descending (newest first)
    const nextIdx = idx - direction
    if (nextIdx >= 0 && nextIdx < monthOptions.length) {
      const opt = monthOptions[nextIdx]
      handleMonthChange(opt.year, opt.month)
    }
  }

  const canGoPrev = monthOptions.findIndex((o) => o.year === year && o.month === month) < monthOptions.length - 1
  const canGoNext = monthOptions.findIndex((o) => o.year === year && o.month === month) > 0

  return (
    <div className="space-y-4">
      {/* Sticky header with title + month selector */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground hidden sm:block">{m.summaryHint}</p>
          <p className="text-sm text-muted-foreground sm:hidden">月次データを入力</p>

          {/* Month selector: arrows + current month button */}
          <div className="relative flex items-center gap-1 shrink-0" ref={pickerRef}>
            <button
              onClick={() => navigateMonth(-1)}
              disabled={!canGoPrev || loading}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              aria-label="前月"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                setPickerYear(year)
                setShowMonthPicker((v) => !v)
              }}
              className="rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors min-w-[100px] text-center"
            >
              {year}年{month}月
            </button>

            <button
              onClick={() => navigateMonth(1)}
              disabled={!canGoNext || loading}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              aria-label="翌月"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Month picker dropdown */}
            {showMonthPicker && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border bg-card p-4 shadow-lg">
                {/* Year selector */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setPickerYear((y) => Math.max(y - 1, years[years.length - 1]))}
                    disabled={pickerYear <= years[years.length - 1]}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold">{pickerYear}年</span>
                  <button
                    onClick={() => setPickerYear((y) => Math.min(y + 1, years[0]))}
                    disabled={pickerYear >= years[0]}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => {
                    const opt = monthOptions.find((o) => o.year === pickerYear && o.month === mo)
                    if (!opt) {
                      return (
                        <div key={mo} className="rounded-md px-2 py-2 text-center text-sm text-muted-foreground/30">
                          {mo}月
                        </div>
                      )
                    }

                    const isSelected = year === opt.year && month === opt.month
                    const key = `${opt.year}-${opt.month}`
                    const status = monthStatuses[key] ?? "empty"

                    let statusDot = ""
                    if (!isSelected) {
                      if (status === "empty") statusDot = "bg-red-400"
                      else if (status === "partial") statusDot = "bg-amber-400"
                      else statusDot = "bg-emerald-400"
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => handleMonthChange(opt.year, opt.month)}
                        className={`relative rounded-md px-2 py-2 text-center text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {mo}月
                        {statusDot && (
                          <span className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${statusDot}`} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />入力済</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />一部入力</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />未入力</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{messages.common.loading}</p>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <MonthlySummarySection
          year={year}
          month={month}
          initialSummary={summary}
          prevSummary={prevSummary}
          surveyCount={surveyCount}
          initialProfile={profile}
          prevProfile={prevProfile}
          autoWorkingDays={autoWorkingDays}
          profileDefaults={profileDefaults}
          clinicType={clinicType as import("@/lib/metrics-utils").ClinicType | undefined}
        />
      )}
    </div>
  )
}
