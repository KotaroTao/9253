import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ROLES } from "@/lib/constants"
import { buildPlanInfo } from "@/lib/plan"
import type { ClinicSettings, PlanInfo } from "@/types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { role } = session.user
  let { clinicId } = session.user

  // 運営モード: system_adminが特定クリニックとして操作
  const operatorClinicId = role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const isOperatorMode = !!operatorClinicId
  if (operatorClinicId) {
    clinicId = operatorClinicId
  }

  // system_admin with no clinicId can still access dashboard
  // clinic_admin and staff must have a clinicId
  if ((role === "clinic_admin" || role === "staff") && !clinicId) {
    redirect("/login")
  }

  let clinicName: string | undefined
  let clinicSlug: string | undefined
  let planInfo: PlanInfo | undefined
  if (clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, slug: true, settings: true },
    })
    clinicName = clinic?.name ?? undefined
    clinicSlug = clinic?.slug ?? undefined
    const settings = (clinic?.settings ?? {}) as ClinicSettings
    planInfo = buildPlanInfo(settings)
  }

  // クリニック一覧（運営モードのクリニック切り替え用）
  let allClinics: Array<{ id: string; name: string }> = []
  if (isOperatorMode) {
    allClinics = await prisma.clinic.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 100,
    })
  }

  return (
    <DashboardShell
      role={role}
      clinicName={clinicName}
      clinicSlug={clinicSlug}
      isOperatorMode={isOperatorMode}
      operatorClinicId={operatorClinicId ?? undefined}
      allClinics={allClinics}
      planInfo={planInfo}
    >
      {children}
    </DashboardShell>
  )
}
