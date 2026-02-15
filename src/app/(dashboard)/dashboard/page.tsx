import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdminMode } from "@/lib/admin-mode"
import { getDashboardStats, getMonthlyTrend, getSatisfactionTrend, getQuestionBreakdown } from "@/lib/queries/stats"
import type { TemplateQuestionScores } from "@/lib/queries/stats"
import { getStaffEngagementData } from "@/lib/queries/engagement"
import { SatisfactionCards } from "@/components/dashboard/satisfaction-cards"
import { SatisfactionTrendChart } from "@/components/dashboard/satisfaction-trend"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { RecentResponses } from "@/components/dashboard/recent-responses"
import { AdminInlineAuth } from "@/components/dashboard/admin-inline-auth"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { StaffEngagement } from "@/components/dashboard/staff-engagement"
import { InsightCards } from "@/components/dashboard/insight-cards"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import { messages } from "@/lib/messages"
import { Smartphone, ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DailyTip } from "@/components/dashboard/daily-tip"
import { getTodayTip, getCurrentTip } from "@/lib/patient-tips"
import type { PatientTip } from "@/lib/patient-tips"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const adminMode = isAdminMode()

  // Check if clinic has admin password set + get slug for kiosk link
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true, settings: true },
  })
  const settings = clinic?.settings as Record<string, unknown> | null
  const hasAdminPassword = !!settings?.adminPassword
  const kioskUrl = clinic ? `/kiosk/${encodeURIComponent(clinic.slug)}` : "/dashboard/survey-start"

  // Daily tip: clinic custom > platform tips (with rotation) > hardcoded fallback
  const customDailyTip = settings?.dailyTip as PatientTip | undefined
  let dailyTip: PatientTip
  const isCustomTip = !!customDailyTip
  if (customDailyTip) {
    dailyTip = customDailyTip
  } else {
    const platformSetting = await prisma.platformSetting.findUnique({
      where: { key: "patientTips" },
    })
    if (platformSetting) {
      const val = platformSetting.value as unknown as { tips: PatientTip[]; rotationMinutes: number }
      dailyTip = val.tips.length > 0
        ? getCurrentTip(val.tips, val.rotationMinutes)
        : getTodayTip()
    } else {
      dailyTip = getTodayTip()
    }
  }
  const role = session.user.role
  const canEditTip = role === "clinic_admin" || role === "system_admin"

  // Time-aware greeting
  const hour = new Date().getHours()
  const greeting = hour < 12
    ? messages.dashboard.staffGreetingMorning
    : hour < 17
      ? messages.dashboard.staffGreetingAfternoon
      : messages.dashboard.staffGreetingEvening

  // Staff engagement data (always fetched for staff home screen)
  const engagement = await getStaffEngagementData(clinicId)

  // Check if clinic has any responses (for first-use guidance)
  const hasResponses = engagement.totalCount > 0

  // Admin analytics data (only fetch when admin mode is active)
  let adminData: {
    stats: Awaited<ReturnType<typeof getDashboardStats>>
    monthlyTrend: Awaited<ReturnType<typeof getMonthlyTrend>>
    satisfactionTrend: Awaited<ReturnType<typeof getSatisfactionTrend>>
    questionBreakdown: TemplateQuestionScores[]
    showSummaryBanner: boolean
    summaryBannerLabel: string
    lowScoreQuestions: Array<{ text: string; avgScore: number }>
  } | null = null

  if (adminMode) {
    const now = new Date()
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevYear = prevDate.getFullYear()
    const prevMonth = prevDate.getMonth() + 1

    const [stats, monthlyTrend, satisfactionTrend, questionBreakdown, lastMonthSummary] =
      await Promise.all([
        getDashboardStats(clinicId),
        getMonthlyTrend(clinicId),
        getSatisfactionTrend(clinicId),
        getQuestionBreakdown(clinicId),
        prisma.monthlyClinicMetrics.findUnique({
          where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
          select: { totalVisits: true },
        }),
      ])

    // Collect low-score questions for insights
    const lowScoreQuestions: Array<{ text: string; avgScore: number }> = []
    for (const template of questionBreakdown) {
      for (const q of template.questions) {
        if (q.avgScore > 0 && q.avgScore < 4.0) {
          lowScoreQuestions.push({ text: q.text, avgScore: q.avgScore })
        }
      }
    }
    lowScoreQuestions.sort((a, b) => a.avgScore - b.avgScore)

    adminData = {
      stats,
      monthlyTrend,
      satisfactionTrend,
      questionBreakdown,
      showSummaryBanner: lastMonthSummary == null,
      summaryBannerLabel: `${prevYear}年${prevMonth}月`,
      lowScoreQuestions,
    }
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages.dashboard.staffDashboardMessage}
        </p>
      </div>

      {/* Admin mode banner - shown when admin mode is active */}
      {adminMode && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">{messages.adminMode.active}</span>
            <span className="hidden text-xs text-emerald-600/70 sm:inline">{messages.dashboard.adminModeDesc}</span>
          </div>
        </div>
      )}

      {/* Admin unlock - shown prominently when NOT in admin mode */}
      {!adminMode && hasAdminPassword && (
        <AdminInlineAuth isAdminMode={false} hasAdminPassword={hasAdminPassword} />
      )}

      {/* First-use guidance - shown when no responses yet and NOT in admin mode */}
      {!adminMode && !hasResponses && (
        <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-5">
          <h3 className="text-sm font-bold text-blue-900">{messages.dashboard.onboardingTitle}</h3>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">1</span>
              <p className="text-sm text-blue-800">{messages.dashboard.onboardingStep1}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">2</span>
              <p className="text-sm text-blue-800">{messages.dashboard.onboardingStep2}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">3</span>
              <p className="text-sm text-blue-800">{messages.dashboard.onboardingStep3}</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily patient satisfaction tip */}
      <DailyTip tip={dailyTip} canEdit={canEditTip} isCustom={isCustomTip} />

      {/* Action card - only shown when NOT in admin mode */}
      {!adminMode && (
        <a
          href={kioskUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
            <Smartphone className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-blue-900">{messages.dashboard.startSurvey}</p>
            <p className="text-sm text-blue-600/70">{messages.dashboard.startSurveyDesc}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" />
        </a>
      )}

      {/* Staff engagement - only shown when NOT in admin mode */}
      {!adminMode && <StaffEngagement data={engagement} />}

      {/* Admin analytics - only when admin mode is active */}
      {adminData && (
        <>
          {/* Score overview + trend indicator */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {messages.dashboard.sectionPatientExperience}
            </h2>

            {/* Score hero card with trend */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-white">
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{messages.dashboard.satisfaction}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-blue-600">
                        {adminData.stats.averageScore > 0 ? adminData.stats.averageScore.toFixed(1) : "-"}
                      </span>
                      {adminData.stats.averageScore > 0 && (
                        <span className="text-lg text-muted-foreground">/ 5.0</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {messages.dashboard.thisMonth}: {adminData.stats.totalResponses}{messages.common.countSuffix}
                    </p>
                  </div>
                  {/* Trend badge */}
                  {adminData.stats.prevAverageScore != null && adminData.stats.averageScore > 0 && (
                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      adminData.stats.averageScore > adminData.stats.prevAverageScore
                        ? "bg-green-100 text-green-700"
                        : adminData.stats.averageScore < adminData.stats.prevAverageScore
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                    }`}>
                      {adminData.stats.averageScore > adminData.stats.prevAverageScore ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : adminData.stats.averageScore < adminData.stats.prevAverageScore ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      {adminData.stats.prevAverageScore > 0 && (
                        <span>
                          {adminData.stats.averageScore > adminData.stats.prevAverageScore ? "+" : ""}
                          {(adminData.stats.averageScore - adminData.stats.prevAverageScore).toFixed(1)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insights — auto-generated action cards */}
            <InsightCards
              averageScore={adminData.stats.averageScore}
              prevAverageScore={adminData.stats.prevAverageScore ?? null}
              totalResponses={adminData.stats.totalResponses}
              lowScoreQuestions={adminData.lowScoreQuestions}
              showSummaryBanner={adminData.showSummaryBanner}
            />

            {/* Question-level breakdown chart + improvement advice */}
            <QuestionBreakdown data={adminData.questionBreakdown} />

            <MonthlyChart data={adminData.monthlyTrend} />

            <RecentResponses responses={adminData.stats.recentResponses} />
          </div>

          {/* Satisfaction Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {messages.dashboard.sectionSatisfaction}
            </h2>

            <SatisfactionCards
              data={{
                patientSatisfaction: {
                  current: adminData.stats.averageScore,
                  prev: adminData.stats.prevAverageScore ?? null,
                },
              }}
            />

            <SatisfactionTrendChart data={adminData.satisfactionTrend} />
          </div>

          {/* Staff Leaderboard */}
          <StaffLeaderboard />

        </>
      )}

      {/* Admin mode controls at bottom - only for admin mode active state */}
      {adminMode && (
        <AdminInlineAuth isAdminMode={adminMode} hasAdminPassword={hasAdminPassword} />
      )}
    </div>
  )
}
