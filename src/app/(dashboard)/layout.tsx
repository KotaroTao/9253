import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isStaffViewOverride, getOperatorClinicId } from "@/lib/admin-mode"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ROLES } from "@/lib/constants"

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
  if (clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, slug: true },
    })
    clinicName = clinic?.name ?? undefined
    clinicSlug = clinic?.slug ?? undefined
  }

  // ロールベースで管理者ビューを判定
  // clinic_admin / system_admin は管理者ビュー（スタッフビュー切替オーバーライドがない限り）
  // 運営モードでは常に管理者ビュー
  const isAdmin = role === "clinic_admin" || role === "system_admin"
  const staffViewOverride = isAdmin && !isOperatorMode && isStaffViewOverride()
  const adminMode = isOperatorMode || (isAdmin && !staffViewOverride)

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
      userName={session.user.name ?? ""}
      clinicName={clinicName}
      clinicSlug={clinicSlug}
      isAdminMode={adminMode}
      isOperatorMode={isOperatorMode}
      operatorClinicId={operatorClinicId ?? undefined}
      allClinics={allClinics}
    >
      {children}
    </DashboardShell>
  )
}
