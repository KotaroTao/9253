import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getStaffEngagementData } from "@/lib/queries/engagement"
import { getQuestionCurrentScores } from "@/lib/queries/stats"
import { getAdvisoryProgress } from "@/lib/queries/advisory"
import { StaffEngagement } from "@/components/dashboard/staff-engagement"
import { messages } from "@/lib/messages"
import { ROLES } from "@/lib/constants"

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

  // Get clinic info for survey links
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true },
  })
  const kioskUrl = clinic ? `/kiosk/${encodeURIComponent(clinic.slug)}` : "/dashboard/survey-start"
  const patientSurveyUrl = clinic ? `/s/${encodeURIComponent(clinic.slug)}` : null

  const isAdmin = session.user.role === ROLES.CLINIC_ADMIN || session.user.role === ROLES.SYSTEM_ADMIN

  // Fetch engagement + active improvement actions + advisory progress + report count
  const [engagement, activeActions, advisoryProgress, advisoryReportCount] = await Promise.all([
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
  ])

  // Fetch current question scores for active actions
  const questionIds = activeActions
    .map((a) => a.targetQuestionId)
    .filter((id): id is string => id != null)
  const questionScores = questionIds.length > 0
    ? await getQuestionCurrentScores(clinicId, questionIds)
    : {}

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {messages.dashboard.staffDashboardMessage}
      </p>
      <StaffEngagement
        data={engagement}
        kioskUrl={kioskUrl}
        patientSurveyUrl={patientSurveyUrl}
        advisoryProgress={advisoryProgress}
        isAdmin={isAdmin}
        advisoryReportCount={advisoryReportCount}
        activeActions={activeActions}
        questionScores={questionScores}
      />
    </div>
  )
}
