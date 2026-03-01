import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getStaffEngagementData } from "@/lib/queries/engagement"
import { getQuestionCurrentScores } from "@/lib/queries/stats"
import { getAdvisoryProgress } from "@/lib/queries/advisory"
import { evaluateSpecialPlanProgress } from "@/lib/plan"
import { StaffEngagement } from "@/components/dashboard/staff-engagement"
import { ActivationChecklist } from "@/components/dashboard/activation-checklist"
import { SpecialPlanCard } from "@/components/dashboard/special-plan-card"
import { pickDashboardMessage } from "@/lib/dynamic-messages"
import { ROLES } from "@/lib/constants"
import type { ClinicSettings } from "@/types"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // 運営モード: system_adminが特定クリニックとして操作
  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  // Get clinic info for survey links + plan check
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true, settings: true },
  })
  const kioskUrl = clinic ? `/kiosk/${encodeURIComponent(clinic.slug)}` : "/dashboard/survey-start"
  const clinicSettings = (clinic?.settings ?? {}) as ClinicSettings

  const isAdmin = session.user.role === ROLES.CLINIC_ADMIN || session.user.role === ROLES.SYSTEM_ADMIN

  // Special plan condition evaluation (only for special plan clinics)
  const specialPlanProgress = clinicSettings.plan === "special" || clinicSettings.specialPlanStatus === "warning"
    ? await evaluateSpecialPlanProgress(clinicId, clinicSettings)
    : null

  // Fetch engagement + active improvement actions + advisory progress + report count + staff count
  const [engagement, activeActions, advisoryProgress, advisoryReportCount, staffCount] = await Promise.all([
    getStaffEngagementData(clinicId),
    prisma.improvementAction.findMany({
      where: { clinicId, status: "active" },
      select: {
        id: true,
        title: true,
        description: true,
        targetQuestion: true,
        targetQuestionId: true,
        baselineScore: true,
        resultScore: true,
        status: true,
        startedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getAdvisoryProgress(clinicId),
    prisma.advisoryReport.count({ where: { clinicId } }),
    prisma.staff.count({ where: { clinicId, isActive: true } }),
  ])

  // Fetch current question scores for active actions
  const questionIds = activeActions
    .map((a) => a.targetQuestionId)
    .filter((id): id is string => id != null)
  const questionScores = questionIds.length > 0
    ? await getQuestionCurrentScores(clinicId, questionIds)
    : {}

  const dynamicMessage = pickDashboardMessage({
    todayCount: engagement.todayCount,
    dailyGoal: engagement.dailyGoal,
    streak: engagement.streak,
    todayAvgScore: engagement.todayAvgScore,
    totalCount: engagement.totalCount,
  })

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {dynamicMessage}
      </p>
      {specialPlanProgress && <SpecialPlanCard progress={specialPlanProgress} />}
      <ActivationChecklist isAdmin={isAdmin} />
      <StaffEngagement
        data={engagement}
        kioskUrl={kioskUrl}
        advisoryProgress={advisoryProgress}
        isAdmin={isAdmin}
        advisoryReportCount={advisoryReportCount}
        activeActions={activeActions}
        questionScores={questionScores}
        staffCount={staffCount}
      />
    </div>
  )
}
