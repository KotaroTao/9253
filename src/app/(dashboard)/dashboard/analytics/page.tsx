import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getHourlyHeatmapData, getDailyTrend, getTemplateTrend, getQuestionBreakdownByDays } from "@/lib/queries/stats"
import { getSurveyResponses } from "@/lib/queries/surveys"
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { SurveyResponseSection } from "@/components/dashboard/survey-response-section"
import { ROLES } from "@/lib/constants"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"

const INITIAL_LIMIT = 20

export default async function AnalyticsPage() {
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

  const [heatmapData, dailyTrend, templateTrend, templateTrendPrev, questionBreakdown, surveyData] =
    await Promise.all([
      getHourlyHeatmapData(clinicId, 30),
      getDailyTrend(clinicId, 30),
      getTemplateTrend(clinicId, 30),
      getTemplateTrend(clinicId, 30, 30),
      getQuestionBreakdownByDays(clinicId, 30),
      getSurveyResponses(clinicId, { page: 1, limit: INITIAL_LIMIT }),
    ])

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
      <SurveyResponseSection
        initialResponses={surveyData.responses}
        total={surveyData.total}
        initialPage={1}
        limit={INITIAL_LIMIT}
      />
    </div>
  )
}
