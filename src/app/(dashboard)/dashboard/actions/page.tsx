import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { ImprovementActionsView } from "@/components/dashboard/improvement-actions"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { ROLES } from "@/lib/constants"
import { getQuestionCurrentScores } from "@/lib/queries/stats"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"

interface TemplateQuestion {
  id: string
  text: string
  type: string
}

interface TemplateData {
  name: string
  questions: TemplateQuestion[]
}

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

  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  // プランゲート
  if (session.user.role !== "system_admin") {
    const planInfo = await getClinicPlanInfo(clinicId)
    if (!hasFeature(planInfo.effectivePlan, "improvement_actions")) {
      return (
        <UpgradePrompt
          feature="improvement_actions"
          featureLabel={messages.plan.featureActions}
          requiredPlan="standard"
          planInfo={planInfo}
        />
      )
    }
  }

  const [actions, templates] = await Promise.all([
    prisma.improvementAction.findMany({
      where: { clinicId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        logs: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.surveyTemplate.findMany({
      where: { clinicId, isActive: true },
      select: { name: true, questions: true },
      orderBy: { name: "asc" },
    }),
  ])

  // Extract question list grouped by template
  const templateQuestions: TemplateData[] = templates.map((t) => ({
    name: t.name,
    questions: ((t.questions as unknown as TemplateQuestion[]) ?? []).filter(
      (q) => q.type === "rating"
    ),
  }))

  // Collect all question IDs from templates + active actions' targetQuestionIds
  const allQuestionIds = new Set<string>()
  for (const t of templateQuestions) {
    for (const q of t.questions) {
      allQuestionIds.add(q.id)
    }
  }
  for (const a of actions) {
    if (a.targetQuestionId) allQuestionIds.add(a.targetQuestionId)
  }

  // Fetch current scores for all questions
  const questionScores = await getQuestionCurrentScores(clinicId, Array.from(allQuestionIds))

  return (
    <div className="space-y-6">
      <ImprovementActionsView
        initialActions={actions}
        templateQuestions={templateQuestions}
        questionScores={questionScores}
      />
    </div>
  )
}
