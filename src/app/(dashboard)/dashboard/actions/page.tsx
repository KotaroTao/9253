import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminMode } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"
import { ImprovementActionsView } from "@/components/dashboard/improvement-actions"

export default async function ActionsPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const adminMode = isAdminMode()
  if (!adminMode && session.user.role !== "system_admin") {
    redirect("/dashboard")
  }

  const actions = await prisma.improvementAction.findMany({
    where: { clinicId: session.user.clinicId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.improvementActions.title}</h1>
      <ImprovementActionsView initialActions={actions} />
    </div>
  )
}
