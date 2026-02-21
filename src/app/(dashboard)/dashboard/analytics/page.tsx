import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getHourlyHeatmapData, getDailyTrend, getTemplateTrend, getQuestionBreakdownByDays } from "@/lib/queries/stats"
import { getSurveyResponses } from "@/lib/queries/surveys"
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageSizeSelector } from "@/components/dashboard/page-size-selector"
import { SurveyResponseList } from "@/components/dashboard/survey-response-list"
import { ROLES } from "@/lib/constants"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"

const ALLOWED_LIMITS = [10, 20, 50] as const

interface AnalyticsPageProps {
  searchParams: { page?: string; limit?: string }
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  if (role === "staff") {
    redirect("/dashboard")
  }

  // 運営モード: system_adminが特定クリニックとして操作
  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  // プランゲート（system_adminは常にアクセス可）
  if (role !== "system_admin") {
    const planInfo = await getClinicPlanInfo(clinicId)
    if (!hasFeature(planInfo.effectivePlan, "analytics")) {
      return (
        <UpgradePrompt
          feature="analytics"
          featureLabel={messages.plan.featureAnalytics}
          requiredPlan="standard"
          planInfo={planInfo}
        />
      )
    }
  }

  // アンケート一覧のページネーション
  const surveyPage = Number(searchParams.page) || 1
  const rawLimit = Number(searchParams.limit) || 20
  const surveyLimit = ALLOWED_LIMITS.includes(rawLimit as typeof ALLOWED_LIMITS[number]) ? rawLimit : 20

  const [heatmapData, dailyTrend, templateTrend, templateTrendPrev, questionBreakdown, surveyData] =
    await Promise.all([
      getHourlyHeatmapData(clinicId, 30),
      getDailyTrend(clinicId, 30),
      getTemplateTrend(clinicId, 30),
      getTemplateTrend(clinicId, 30, 30),
      getQuestionBreakdownByDays(clinicId, 30),
      getSurveyResponses(clinicId, { page: surveyPage, limit: surveyLimit }),
    ])

  function buildSurveyUrl(params: { page?: number; limit?: number }) {
    const p = params.page ?? surveyPage
    const l = params.limit ?? surveyLimit
    const qs = new URLSearchParams()
    qs.set("page", String(p))
    if (l !== 20) qs.set("limit", String(l))
    return `/dashboard/analytics?${qs.toString()}`
  }

  return (
    <div className="space-y-6">
      <AnalyticsCharts
        initialDailyTrend={dailyTrend}
        initialTemplateTrend={templateTrend}
        initialTemplateTrendPrev={templateTrendPrev}
        initialQuestionBreakdown={questionBreakdown}
        heatmapData={heatmapData}
      />

      {/* アンケート一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {messages.nav.surveys}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {surveyData.total}{messages.common.countSuffix}
              </span>
            </CardTitle>
            <PageSizeSelector currentLimit={surveyLimit} basePath="/dashboard/analytics" />
          </div>
        </CardHeader>
        <CardContent>
          {surveyData.responses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {messages.common.noData}
            </p>
          ) : (
            <SurveyResponseList responses={surveyData.responses} />
          )}

          {/* Pagination */}
          {surveyData.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {surveyPage > 1 && (
                <Link
                  href={buildSurveyUrl({ page: surveyPage - 1 })}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                >
                  {messages.common.back}
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {surveyPage} / {surveyData.totalPages}
              </span>
              {surveyPage < surveyData.totalPages && (
                <Link
                  href={buildSurveyUrl({ page: surveyPage + 1 })}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                >
                  {messages.common.next}
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
