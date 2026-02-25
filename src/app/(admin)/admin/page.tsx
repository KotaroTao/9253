import Link from "next/link"
import { Suspense } from "react"
import { getAllClinics, getClinicHealthBatch, getPlatformTodayStats } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Lightbulb, HardDrive, SmilePlus, Megaphone, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react"
import { SpecialPlanUrl, GuideUrl } from "@/components/admin/special-plan-url"
import { ClinicSearch } from "@/components/admin/clinic-search"
import { ClinicRow } from "@/components/admin/clinic-row"
import { PxValueDashboard } from "@/components/admin/px-value-dashboard"
import { AddClinicDialog } from "@/components/admin/add-clinic-dialog"
import type { ClinicSettings, PlanTier } from "@/types"

function ScoreBadge({ score, prevScore }: { score: number | null; prevScore: number | null }) {
  if (score == null) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const scoreColor = score >= 4.0
    ? "text-emerald-700 bg-emerald-50"
    : score >= 3.0
      ? "text-amber-700 bg-amber-50"
      : "text-red-700 bg-red-50"

  const delta = prevScore != null ? score - prevScore : null

  return (
    <div className="flex items-center gap-1.5">
      <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${scoreColor}`}>
        {score.toFixed(1)}
      </span>
      {delta != null && delta !== 0 && (
        <span className={`flex items-center text-[10px] font-medium ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {delta > 0 ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function ClinicStatusIndicator({ todayCount, lastResponseAt, avgScore }: {
  todayCount: number
  lastResponseAt: Date | null
  avgScore: number | null
}) {
  if (!lastResponseAt) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        未稼働
      </div>
    )
  }

  const daysSinceLastResponse = Math.floor(
    (Date.now() - new Date(lastResponseAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastResponse >= 7) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-red-500">
        <AlertTriangle className="h-3 w-3" />
        {daysSinceLastResponse}日間停止
      </div>
    )
  }

  if (avgScore != null && avgScore < 3.5) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-amber-600">
        <AlertTriangle className="h-3 w-3" />
        要注意
      </div>
    )
  }

  if (todayCount > 0) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-emerald-600">
        <Activity className="h-3 w-3" />
        稼働中
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
      本日未稼働
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const search = params.search ?? ""

  // 全クエリを並列実行（3本同時）
  const [{ clinics, total, totalPages }, totalResponsesResult, platformToday] = await Promise.all([
    getAllClinics({ page, limit: 20, search }),
    prisma.$queryRaw<Array<{ estimate: bigint }>>`
      SELECT GREATEST(
        (SELECT reltuples::bigint FROM pg_class WHERE relname = 'survey_responses'),
        0
      ) AS estimate
    `,
    getPlatformTodayStats(),
  ])
  const totalResponses = Number(totalResponsesResult[0]?.estimate ?? 0)

  // クリニック単位のKPIをバッチ取得（クリニック一覧取得後に実行）
  const clinicIds = clinics.map((c) => c.id)
  const healthMap = await getClinicHealthBatch(clinicIds)

  function paginationHref(targetPage: number) {
    const params = new URLSearchParams()
    if (targetPage > 1) params.set("page", String(targetPage))
    if (search) params.set("search", search)
    const qs = params.toString()
    return `/admin${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.admin.title}</h1>

      {/* Platform KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {messages.admin.clinicCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本日の回答
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{platformToday.todayTotal}</span>
              <span className="text-xs text-muted-foreground">
                {platformToday.activeClinicsToday}院稼働
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本日の平均スコア
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platformToday.platformAvgScore != null
                ? platformToday.platformAvgScore.toFixed(1)
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {messages.admin.totalResponses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalResponses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management links */}
      <div className="space-y-3">
        <SpecialPlanUrl />
        <GuideUrl />

        <Link
          href="/admin/tips"
          className="flex items-center justify-between rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50/80 to-white p-4 transition-colors hover:border-amber-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{messages.tipManager.title}</p>
              <p className="text-xs text-muted-foreground">{messages.tipManager.description}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/improvement-actions"
          className="flex items-center justify-between rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50/80 to-white p-4 transition-colors hover:border-purple-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{messages.platformActions.manage}</p>
              <p className="text-xs text-muted-foreground">{messages.platformActions.pickupDesc}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/backups"
          className="flex items-center justify-between rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/80 to-white p-4 transition-colors hover:border-blue-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{messages.backup.title}</p>
              <p className="text-xs text-muted-foreground">{messages.backup.description}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/kawaii-teeth"
          className="flex items-center justify-between rounded-lg border border-pink-200 bg-gradient-to-r from-pink-50/80 to-white p-4 transition-colors hover:border-pink-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
              <SmilePlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{messages.kawaiiTeeth.adminTitle}</p>
              <p className="text-xs text-muted-foreground">{messages.kawaiiTeeth.adminDescription}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      {/* PX-Value Rankings */}
      <Suspense>
        <PxValueDashboard />
      </Suspense>

      {/* Clinic list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">
                {messages.admin.clinicList}
              </CardTitle>
              <AddClinicDialog />
            </div>
            <div className="w-full sm:w-72">
              <Suspense>
                <ClinicSearch />
              </Suspense>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {search ? `「${search}」に一致するクリニックはありません` : messages.common.noData}
            </p>
          ) : (
            <div className="space-y-2">
              {clinics.map((clinic) => {
                const health = healthMap.get(clinic.id)
                const clinicSettings = (clinic.settings ?? {}) as ClinicSettings
                const clinicPlan = (clinicSettings.plan ?? "free") as PlanTier
                return (
                  <ClinicRow key={clinic.id} clinicId={clinic.id} clinicName={clinic.name} plan={clinicPlan} hasMetricsPin={!!clinicSettings.metricsPin}>
                    {/* Row 1: Clinic name + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{clinic.name}</h3>
                          {health && (
                            <ClinicStatusIndicator
                              todayCount={health.todayCount}
                              lastResponseAt={health.lastResponseAt}
                              avgScore={health.avgScore}
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">/{clinic.slug}</p>
                      </div>
                    </div>

                    {/* Row 2: Metrics grid */}
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">満足度</p>
                        <div className="mt-0.5">
                          <ScoreBadge
                            score={health?.avgScore ?? null}
                            prevScore={health?.prevMonthAvg ?? null}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">本日</p>
                        <p className="mt-0.5 text-sm font-bold">
                          {health?.todayCount ?? 0}
                          <span className="text-xs font-normal text-muted-foreground">件</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">今月</p>
                        <p className="mt-0.5 text-sm font-bold">
                          {health?.thisMonthCount ?? 0}
                          <span className="text-xs font-normal text-muted-foreground">件</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{messages.common.staffLabel}</p>
                        <p className="mt-0.5 text-sm font-bold">
                          {clinic._count.staff}
                          <span className="text-xs font-normal text-muted-foreground">人</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">総回答</p>
                        <p className="mt-0.5 text-sm font-bold">
                          {clinic._count.surveyResponses.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">件</span>
                        </p>
                      </div>
                    </div>
                  </ClinicRow>
                )
              })}
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                {total}件中 {(page - 1) * 20 + 1}〜{Math.min(page * 20, total)}件
              </p>
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link
                    href={paginationHref(page - 1)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    前へ
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (p === 1 || p === totalPages) return true
                    if (Math.abs(p - page) <= 1) return true
                    return false
                  })
                  .reduce<Array<number | "ellipsis">>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push("ellipsis")
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`e${idx}`} className="px-1.5 text-xs text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={paginationHref(item as number)}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                          item === page
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-muted"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}
                {page < totalPages && (
                  <Link
                    href={paginationHref(page + 1)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    次へ
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
