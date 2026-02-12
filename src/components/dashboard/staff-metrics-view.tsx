"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import { TrendingUp, TrendingDown } from "lucide-react"
import { MonthlySummarySection } from "./monthly-summary-section"
import type { StaffTallyMetrics } from "@/types"

interface ClinicTotals {
  newPatientCount: number
  maintenanceTransitionCount: number
  selfPayProposalCount: number
  selfPayConversionCount: number
  maintenanceRate: number | null
  selfPayRate: number | null
}

interface MonthlySummary {
  totalVisits: number | null
  totalRevenue: number | null
  selfPayRevenue: number | null
  googleReviewCount: number | null
  googleReviewRating: number | null
}

interface SurveyQuality {
  lowScoreCount: number
  freeTextRate: number | null
}

interface StaffMetricsViewProps {
  initialStaffMetrics: StaffTallyMetrics[]
  initialClinicTotals: ClinicTotals
  initialPrevTotals: ClinicTotals | null
  initialSummary: MonthlySummary | null
  initialPrevSummary: MonthlySummary | null
  initialSurveyCount: number
  initialSurveyQuality: SurveyQuality | null
  initialYear: number
  initialMonth: number
  clinicId: string
}

function RateDelta({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) return null
  const isUp = diff > 0
  return (
    <span className={`ml-1 inline-flex items-center gap-0.5 text-xs ${isUp ? "text-green-600" : "text-red-500"}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? "+" : ""}{diff}
    </span>
  )
}

export function StaffMetricsView({
  initialStaffMetrics,
  initialClinicTotals,
  initialPrevTotals,
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialSurveyQuality,
  initialYear,
  initialMonth,
}: StaffMetricsViewProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [staffMetrics, setStaffMetrics] = useState(initialStaffMetrics)
  const [clinicTotals, setClinicTotals] = useState(initialClinicTotals)
  const [prevTotals, setPrevTotals] = useState<ClinicTotals | null>(initialPrevTotals)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [surveyQuality, setSurveyQuality] = useState<SurveyQuality | null>(initialSurveyQuality)
  const [loading, setLoading] = useState(false)

  const now = new Date()
  const monthOptions: { year: number; month: number; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
    })
  }

  async function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear)
    setMonth(newMonth)
    setLoading(true)

    try {
      const res = await fetch(
        `/api/monthly-metrics?year=${newYear}&month=${newMonth}`
      )
      if (res.ok) {
        const data = await res.json()
        setStaffMetrics(data.staffMetrics)
        setClinicTotals(data.clinicTotals)
        setPrevTotals(data.prevTotals ?? null)
        setSummary(data.summary ?? null)
        setPrevSummary(data.prevSummary ?? null)
        setSurveyCount(data.surveyCount ?? 0)
        setSurveyQuality(data.surveyQuality ?? null)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const hasData =
    clinicTotals.newPatientCount > 0 || clinicTotals.selfPayProposalCount > 0

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex flex-wrap gap-2">
        {monthOptions.map((opt) => (
          <Button
            key={`${opt.year}-${opt.month}`}
            variant={year === opt.year && month === opt.month ? "default" : "outline"}
            size="sm"
            onClick={() => handleMonthChange(opt.year, opt.month)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{messages.common.loading}</p>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <>
          {/* Monthly Summary Input */}
          <MonthlySummarySection
            year={year}
            month={month}
            initialSummary={summary}
            prevSummary={prevSummary}
            surveyCount={surveyCount}
            surveyQuality={surveyQuality}
            tallyNewPatientCount={clinicTotals.newPatientCount}
            tallySelfPayConversionCount={clinicTotals.selfPayConversionCount}
          />

          {/* Tally info */}
          <p className="text-xs text-muted-foreground">{messages.monthlyMetrics.inputHint}</p>

          {!hasData && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{messages.monthlyMetrics.noData}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {messages.tally.noDataHint}
                </p>
              </CardContent>
            </Card>
          )}

          {hasData && (
            <>
              {/* Clinic totals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{messages.monthlyMetrics.clinicTotal}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{messages.monthlyMetrics.newPatientCount}</p>
                      <p className="text-xl font-bold">{clinicTotals.newPatientCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{messages.dashboard.maintenanceRate}</p>
                      <p className="text-xl font-bold text-orange-600">
                        {clinicTotals.maintenanceRate != null ? `${clinicTotals.maintenanceRate}%` : "-"}
                        <RateDelta current={clinicTotals.maintenanceRate} prev={prevTotals?.maintenanceRate ?? null} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({clinicTotals.maintenanceTransitionCount}/{clinicTotals.newPatientCount})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{messages.monthlyMetrics.selfPayProposalCount}</p>
                      <p className="text-xl font-bold">{clinicTotals.selfPayProposalCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{messages.dashboard.selfPayRate}</p>
                      <p className="text-xl font-bold text-purple-600">
                        {clinicTotals.selfPayRate != null ? `${clinicTotals.selfPayRate}%` : "-"}
                        <RateDelta current={clinicTotals.selfPayRate} prev={prevTotals?.selfPayRate ?? null} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({clinicTotals.selfPayConversionCount}/{clinicTotals.selfPayProposalCount})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Per-staff breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{messages.monthlyMetrics.staffBreakdown}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2">{messages.common.staffLabel}</th>
                          <th className="pb-2 text-right">{messages.tally.newPatient}</th>
                          <th className="pb-2 text-right">{messages.tally.maintenanceTransition}</th>
                          <th className="pb-2 text-right">{messages.dashboard.maintenanceRate}</th>
                          <th className="pb-2 text-right">{messages.tally.selfPayProposal}</th>
                          <th className="pb-2 text-right">{messages.tally.selfPayConversion}</th>
                          <th className="pb-2 text-right">{messages.dashboard.selfPayRate}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffMetrics.map((s) => (
                          <tr key={s.staffId} className="border-b last:border-0">
                            <td className="py-2">
                              <span className="font-medium">{s.name}</span>
                              <span className="ml-1 text-xs text-muted-foreground">
                                {STAFF_ROLE_LABELS[s.role] ?? s.role}
                              </span>
                            </td>
                            <td className="py-2 text-right">{s.newPatientCount}</td>
                            <td className="py-2 text-right">{s.maintenanceTransitionCount}</td>
                            <td className="py-2 text-right font-medium text-orange-600">
                              {s.maintenanceRate != null ? `${s.maintenanceRate}%` : "-"}
                            </td>
                            <td className="py-2 text-right">{s.selfPayProposalCount}</td>
                            <td className="py-2 text-right">{s.selfPayConversionCount}</td>
                            <td className="py-2 text-right font-medium text-purple-600">
                              {s.selfPayRate != null ? `${s.selfPayRate}%` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
