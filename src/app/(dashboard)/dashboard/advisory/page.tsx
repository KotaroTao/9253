import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getAdvisoryProgress, getAdvisoryReports } from "@/lib/queries/advisory"
import { AdvisoryReportView } from "@/components/dashboard/advisory-report"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { ROLES } from "@/lib/constants"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"

export default async function AdvisoryPage() {
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

  // プランゲート
  if (role !== "system_admin") {
    const planInfo = await getClinicPlanInfo(clinicId)
    if (!hasFeature(planInfo.effectivePlan, "advisory")) {
      return (
        <UpgradePrompt
          feature="advisory"
          featureLabel={messages.plan.featureAdvisory}
          requiredPlan="standard"
          planInfo={planInfo}
        />
      )
    }
  }

  const [progress, reports] = await Promise.all([
    getAdvisoryProgress(clinicId),
    getAdvisoryReports(clinicId),
  ])

  return <AdvisoryReportView progress={progress} reports={reports} />
}
