import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminMode } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { getStaffSurveys, getActiveStaffSurvey } from "@/lib/queries/staff-surveys"
import { StaffSurveyManagement } from "@/components/dashboard/staff-survey-management"
import { messages } from "@/lib/messages"

export default async function StaffSurveyPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const adminMode = isAdminMode()
  if (!adminMode && session.user.role !== "system_admin") {
    redirect("/dashboard")
  }

  const clinicId = session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const [surveys, activeSurvey, activeStaffCount] = await Promise.all([
    getStaffSurveys(clinicId),
    getActiveStaffSurvey(clinicId),
    prisma.staff.count({ where: { clinicId, isActive: true } }),
  ])

  const activeSummary = activeSurvey
    ? {
        id: activeSurvey.id,
        title: activeSurvey.title,
        status: activeSurvey.status,
        startsAt: activeSurvey.startsAt,
        endsAt: activeSurvey.endsAt,
        responseCount: activeSurvey._count.responses,
        overallScore: null,
      }
    : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.staffSurvey.management}</h1>
      <StaffSurveyManagement
        initialSurveys={surveys}
        activeSurvey={activeSummary}
        staffCount={activeStaffCount}
      />
    </div>
  )
}
