import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getAdvisoryProgress, getAdvisoryReports } from "@/lib/queries/advisory"
import { AdvisoryReportView } from "@/components/dashboard/advisory-report"
import { ROLES } from "@/lib/constants"

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

  const [progress, reports] = await Promise.all([
    getAdvisoryProgress(clinicId),
    getAdvisoryReports(clinicId),
  ])

  return <AdvisoryReportView progress={progress} reports={reports} />
}
