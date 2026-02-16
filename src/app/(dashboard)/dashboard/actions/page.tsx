import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminMode, getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"
import { ImprovementActionsView } from "@/components/dashboard/improvement-actions"
import { ROLES } from "@/lib/constants"

export default async function ActionsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const adminMode = isAdminMode()
  if (!adminMode && session.user.role !== "system_admin") {
    redirect("/dashboard")
  }

  const actions = await prisma.improvementAction.findMany({
    where: { clinicId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.improvementActions.title}</h1>
      <ImprovementActionsView initialActions={actions} />
    </div>
  )
}
