"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { TemplateTrendChart } from "@/components/dashboard/template-trend-chart"
import { TemplateTrendSmallMultiples } from "@/components/dashboard/template-trend-small-multiples"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { SatisfactionHeatmap } from "@/components/dashboard/satisfaction-heatmap"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import { PurposeSatisfaction } from "@/components/dashboard/purpose-satisfaction"
import {
  VISIT_TYPES,
  INSURANCE_TYPES,
  INSURANCE_PURPOSES,
  SELF_PAY_PURPOSES,
  AGE_GROUPS,
  GENDERS,
} from "@/lib/constants"
import type { DailyTrendPoint, TemplateTrendPoint, TemplateQuestionScores, HeatmapCell } from "@/lib/queries/stats"

export interface CustomRange {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

export interface AttrFilterState {
  visitType: string
  insuranceType: string
  purpose: string
  ageGroup: string
  gender: string
}

const EMPTY_FILTERS: AttrFilterState = { visitType: "", insuranceType: "", purpose: "", ageGroup: "", gender: "" }

const PERIOD_PRESETS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
  { label: "180日", value: 180 },
  { label: "1年", value: 365 },
] as const

export function formatPeriodLabel(days: number): string {
  if (days >= 365 && days % 365 === 0) return `${days / 365}年`
  return `${days}日`
}

/** APIクエリパラメータ文字列を構築 */
export function buildPeriodQuery(customRange: CustomRange | null, days: number): string {
  if (customRange) return `from=${customRange.from}&to=${customRange.to}`
  return `days=${days}`
}

/** フィルタをクエリ文字列に追加 */
function appendFilterQuery(base: string, filters: AttrFilterState): string {
  const parts = [base]
  if (filters.visitType) parts.push(`visitType=${filters.visitType}`)
  if (filters.insuranceType) parts.push(`insuranceType=${filters.insuranceType}`)
  if (filters.purpose) parts.push(`purpose=${filters.purpose}`)
  if (filters.ageGroup) parts.push(`ageGroup=${filters.ageGroup}`)
  if (filters.gender) parts.push(`gender=${filters.gender}`)
  return parts.join("&")
}

/** 表示用の期間ラベル */
export function periodDisplayLabel(customRange: CustomRange | null, days: number): string {
  if (customRange) {
    const f = customRange.from.replace(/-/g, "/")
    const t = customRange.to.replace(/-/g, "/")
    return `${f}〜${t}`
  }
  return `直近${formatPeriodLabel(days)}`
}

function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function activeFilterCount(f: AttrFilterState): number {
  return Object.values(f).filter(Boolean).length
}

function purposeOptions(insuranceType: string) {
  if (insuranceType === "insurance") return INSURANCE_PURPOSES
  if (insuranceType === "self_pay") return SELF_PAY_PURPOSES
  return [...INSURANCE_PURPOSES, ...SELF_PAY_PURPOSES]
}

interface AnalyticsChartsProps {
  initialDailyTrend: DailyTrendPoint[]
  initialTemplateTrend: TemplateTrendPoint[]
  initialTemplateTrendPrev: TemplateTrendPoint[]
  initialQuestionBreakdown: TemplateQuestionScores[]
  heatmapData: HeatmapCell[]
}

export function AnalyticsCharts({
  initialDailyTrend,
  initialTemplateTrend,
  initialTemplateTrendPrev,
  initialQuestionBreakdown,
  heatmapData,
}: AnalyticsChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [customRange, setCustomRange] = useState<CustomRange | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(() => daysAgoStr(90))
  const [customTo, setCustomTo] = useState(todayStr)
  const [questionData, setQuestionData] = useState<TemplateQuestionScores[]>(initialQuestionBreakdown)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [templateTrendData, setTemplateTrendData] = useState<TemplateTrendPoint[]>(initialTemplateTrend)
  const [templateTrendPrevData, setTemplateTrendPrevData] = useState<TemplateTrendPoint[]>(initialTemplateTrendPrev)
  const [templateTrendLoading, setTemplateTrendLoading] = useState(false)
  const isInitialMount = useRef(true)
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

  // --- Attribute filters ---
  const [filters, setFilters] = useState<AttrFilterState>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const filterCount = activeFilterCount(filters)

  useEffect(() => {
    setHeaderSlot(document.getElementById("header-actions"))
  }, [])

  const periodQuery = buildPeriodQuery(customRange, selectedPeriod)
  const fullQuery = appendFilterQuery(periodQuery, filters)

  const fetchQuestionBreakdown = useCallback(async (query: string) => {
    setQuestionLoading(true)
    try {
      const res = await fetch(`/api/question-breakdown?${query}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const json = await res.json()
        setQuestionData(json)
      }
    } finally {
      setQuestionLoading(false)
    }
  }, [])

  const fetchTemplateTrend = useCallback(async (query: string, isCustom: boolean, days: number, filterQuery: string) => {
    setTemplateTrendLoading(true)
    try {
      // For custom range, compute prev period from/to
      let prevQuery: string
      if (isCustom) {
        // prev period: shift back by same duration
        const fromDate = new Date(query.match(/from=([^&]+)/)?.[1] ?? "")
        const toDate = new Date(query.match(/to=([^&]+)/)?.[1] ?? "")
        const durationMs = toDate.getTime() - fromDate.getTime()
        const prevTo = new Date(fromDate.getTime() - 1)
        const prevFrom = new Date(prevTo.getTime() - durationMs)
        const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        prevQuery = `from=${fmt(prevFrom)}&to=${fmt(prevTo)}`
      } else {
        prevQuery = `days=${days}&offset=${days}`
      }

      const [currentRes, prevRes] = await Promise.all([
        fetch(`/api/template-trend?${filterQuery}`, { cache: "no-store" }),
        fetch(`/api/template-trend?${appendFilterQuery(prevQuery, filters)}`, { cache: "no-store" }),
      ])
      if (currentRes.ok) {
        setTemplateTrendData(await currentRes.json())
      }
      if (prevRes.ok) {
        setTemplateTrendPrevData(await prevRes.json())
      }
    } finally {
      setTemplateTrendLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const pq = buildPeriodQuery(customRange, selectedPeriod)
    const fq = appendFilterQuery(pq, filters)
    fetchQuestionBreakdown(fq)
    fetchTemplateTrend(pq, customRange !== null, selectedPeriod, fq)
  }, [selectedPeriod, customRange, filters, fetchQuestionBreakdown, fetchTemplateTrend])

  function handlePresetClick(value: number) {
    setShowCustom(false)
    setCustomRange(null)
    setSelectedPeriod(value)
  }

  function handleCustomSubmit() {
    if (!customFrom || !customTo || customFrom >= customTo) return
    setCustomRange({ from: customFrom, to: customTo })
    setShowCustom(false)
  }

  function handleFilterChange(key: keyof AttrFilterState, value: string) {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      // insuranceType が変更された時、purpose が新しい保険種別に合わない場合はクリア
      if (key === "insuranceType") {
        const validPurposes: string[] = purposeOptions(value).map(o => o.value)
        if (next.purpose && !validPurposes.includes(next.purpose)) {
          next.purpose = ""
        }
      }
      return next
    })
  }

  function clearAllFilters() {
    setFilters(EMPTY_FILTERS)
  }

  const isPreset = !customRange && PERIOD_PRESETS.some((o) => o.value === selectedPeriod)
  const label = periodDisplayLabel(customRange, selectedPeriod)

  const periodSelector = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {label}
      </span>
      {/* Desktop: ボタン群 */}
      <div className="hidden gap-1 sm:flex">
        {PERIOD_PRESETS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePresetClick(opt.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !customRange && selectedPeriod === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {showCustom ? (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border bg-card px-2 py-1 text-xs"
            />
            <span className="text-xs text-muted-foreground">〜</span>
            <input
              type="date"
              value={customTo}
              max={todayStr()}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border bg-card px-2 py-1 text-xs"
            />
            <button
              onClick={handleCustomSubmit}
              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
            >
              適用
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className="rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              x
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              customRange
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {customRange ? label : "カスタム"}
          </button>
        )}
      </div>
      {/* Mobile: セレクト */}
      <select
        value={customRange ? "custom" : isPreset ? selectedPeriod : "custom"}
        onChange={(e) => {
          const val = e.target.value
          if (val === "custom") {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            setCustomRange(null)
            setSelectedPeriod(Number(val))
          }
        }}
        className="rounded-md border bg-card px-2 py-1.5 text-xs sm:hidden"
      >
        {PERIOD_PRESETS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            直近{opt.label}
          </option>
        ))}
        <option value="custom">カスタム...</option>
      </select>
      {showCustom && (
        <div className="flex items-center gap-1 sm:hidden">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-md border bg-card px-2 py-1 text-xs"
          />
          <span className="text-xs text-muted-foreground">〜</span>
          <input
            type="date"
            value={customTo}
            max={todayStr()}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-md border bg-card px-2 py-1 text-xs"
          />
          <button
            onClick={handleCustomSubmit}
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
          >
            適用
          </button>
        </div>
      )}
    </div>
  )

  const purposes = purposeOptions(filters.insuranceType)

  const filterBar = (
    <div className="space-y-2">
      {/* フィルタトグルボタン */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            filterCount > 0
              ? "border-primary/30 bg-primary/5 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          患者属性フィルタ
          {filterCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
              {filterCount}
            </span>
          )}
        </button>
        {filterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            クリア
          </button>
        )}
        {/* アクティブフィルタのチップ表示 */}
        {filterCount > 0 && !showFilters && (
          <div className="flex flex-wrap gap-1">
            {filters.visitType && (
              <FilterChip
                label={VISIT_TYPES.find(v => v.value === filters.visitType)?.label ?? filters.visitType}
                onRemove={() => handleFilterChange("visitType", "")}
              />
            )}
            {filters.insuranceType && (
              <FilterChip
                label={INSURANCE_TYPES.find(v => v.value === filters.insuranceType)?.label ?? filters.insuranceType}
                onRemove={() => handleFilterChange("insuranceType", "")}
              />
            )}
            {filters.purpose && (
              <FilterChip
                label={[...INSURANCE_PURPOSES, ...SELF_PAY_PURPOSES].find(v => v.value === filters.purpose)?.label ?? filters.purpose}
                onRemove={() => handleFilterChange("purpose", "")}
              />
            )}
            {filters.ageGroup && (
              <FilterChip
                label={AGE_GROUPS.find(v => v.value === filters.ageGroup)?.label ?? filters.ageGroup}
                onRemove={() => handleFilterChange("ageGroup", "")}
              />
            )}
            {filters.gender && (
              <FilterChip
                label={GENDERS.find(v => v.value === filters.gender)?.label ?? filters.gender}
                onRemove={() => handleFilterChange("gender", "")}
              />
            )}
          </div>
        )}
      </div>

      {/* フィルタパネル */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect
              label="来院種別"
              value={filters.visitType}
              onChange={(v) => handleFilterChange("visitType", v)}
              options={VISIT_TYPES}
            />
            <FilterSelect
              label="診療区分"
              value={filters.insuranceType}
              onChange={(v) => handleFilterChange("insuranceType", v)}
              options={INSURANCE_TYPES}
            />
            <FilterSelect
              label="診療内容"
              value={filters.purpose}
              onChange={(v) => handleFilterChange("purpose", v)}
              options={purposes}
            />
            <FilterSelect
              label="年代"
              value={filters.ageGroup}
              onChange={(v) => handleFilterChange("ageGroup", v)}
              options={AGE_GROUPS}
            />
            <FilterSelect
              label="性別"
              value={filters.gender}
              onChange={(v) => handleFilterChange("gender", v)}
              options={GENDERS}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            ※ キオスクモードで入力された回答のみフィルタ対象です
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {headerSlot && createPortal(periodSelector, headerSlot)}

      {filterBar}

      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
        customRange={customRange}
        filterQuery={fullQuery}
      />

      <TemplateTrendChart
        data={templateTrendData}
        loading={templateTrendLoading}
      />

      <TemplateTrendSmallMultiples
        data={templateTrendData}
        prevData={templateTrendPrevData}
        selectedPeriod={selectedPeriod}
        customRange={customRange}
      />

      {questionLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <QuestionBreakdown data={questionData} selectedPeriod={selectedPeriod} customRange={customRange} />
      )}

      <PurposeSatisfaction selectedPeriod={selectedPeriod} customRange={customRange} filterQuery={fullQuery} />

      {/* ヒートマップ + リーダーボード */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SatisfactionHeatmap initialData={heatmapData} selectedPeriod={selectedPeriod} customRange={customRange} filterQuery={fullQuery} />
        <StaffLeaderboard />
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
      >
        <option value="">すべて</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-destructive" aria-label="削除">
        ×
      </button>
    </span>
  )
}
