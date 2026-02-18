import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getStaffEngagementData } from "@/lib/queries/engagement"
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

  // Get clinic info for kiosk link
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true },
  })
  const kioskUrl = clinic ? `/kiosk/${encodeURIComponent(clinic.slug)}` : "/dashboard/survey-start"

  // Fetch engagement + active improvement actions
  const [engagement, activeActions] = await Promise.all([
    getStaffEngagementData(clinicId),
    prisma.improvementAction.findMany({
      where: { clinicId, status: "active" },
      select: { id: true, title: true, description: true, targetQuestion: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {messages.dashboard.staffDashboardMessage}
      </p>
      <StaffEngagement data={engagement} kioskUrl={kioskUrl} activeActions={activeActions} />
    </div>
  )
}
