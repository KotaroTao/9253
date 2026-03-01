import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { ImprovementActionsView } from "@/components/dashboard/improvement-actions"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { ROLES } from "@/lib/constants"
import { getQuestionCurrentScores } from "@/lib/queries/stats"
import { getPlatformActionOutcomes } from "@/lib/queries/platform-action-stats"
import { getSeasonalIndices } from "@/lib/queries/seasonal-index"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"

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

  const [actions, templates, platformActions, monthlyMetrics, clinic] = await Promise.all([
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
    prisma.platformImprovementAction.findMany({
      where: { isActive: true },
      orderBy: [{ isPickup: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.monthlyClinicMetrics.findMany({
      where: { clinicId },
      select: {
        year: true,
        month: true,
        totalPatientCount: true,
        totalRevenue: true,
        cancellationCount: true,
        totalVisitCount: true,
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    }),
  ])

  // Extract question list grouped by template (初診→再診 order)
  const TEMPLATE_ORDER: Record<string, number> = { "初診": 0, "再診": 1 }
  const templateQuestions: TemplateData[] = templates
    .map((t) => ({
      name: t.name,
      questions: ((t.questions as unknown as TemplateQuestion[]) ?? []).filter(
        (q) => q.type === "rating"
      ),
    }))
    .sort((a, b) => (TEMPLATE_ORDER[a.name] ?? 99) - (TEMPLATE_ORDER[b.name] ?? 99))

  // Collect all question IDs from templates + active actions' targetQuestionIds
  const allQuestionIds = new Set<string>()
  for (const t of templateQuestions) {
    for (const q of t.questions) {
      allQuestionIds.add(q.id)
    }
  }
  for (const a of actions) {
    if (a.targetQuestionId) {
      // Support comma-separated multiple question IDs
      for (const qId of a.targetQuestionId.split(",")) {
        const trimmed = qId.trim()
        if (trimmed) allQuestionIds.add(trimmed)
      }
    }
  }

  // Fetch current scores for all questions
  const questionScores = await getQuestionCurrentScores(clinicId, Array.from(allQuestionIds))

  // Adopted platform action IDs (active ones only)
  const adoptedPlatformActionIds = actions
    .filter((a) => a.platformActionId && a.status === "active")
    .map((a) => a.platformActionId!)

  // クロスクリニック実績集計
  const platformActionOutcomes = await getPlatformActionOutcomes(
    platformActions.map((pa) => pa.id)
  )

  // 季節指数を取得
  const clinicType = ((clinic?.settings as ClinicSettings | null)?.clinicType) ?? "general"
  const seasonalIndices = await getSeasonalIndices(clinicId, clinicType)

  return (
    <div className="space-y-6">
      <ImprovementActionsView
        initialActions={actions}
        templateQuestions={templateQuestions}
        questionScores={questionScores}
        platformActions={platformActions.map((pa) => ({
          ...pa,
          targetQuestionIds: pa.targetQuestionIds as string[] | null,
        }))}
        adoptedPlatformActionIds={adoptedPlatformActionIds}
        isSystemAdmin={session.user.role === ROLES.SYSTEM_ADMIN}
        monthlyMetrics={monthlyMetrics}
        seasonalIndices={seasonalIndices}
        platformActionOutcomes={platformActionOutcomes}
      />
    </div>
  )
}
