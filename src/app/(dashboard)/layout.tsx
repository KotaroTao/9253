import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner"
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard"
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
  let onboardingCompleted = true
  if (clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, slug: true, settings: true },
    })
    clinicName = clinic?.name ?? undefined
    clinicSlug = clinic?.slug ?? undefined
    const settings = (clinic?.settings ?? {}) as ClinicSettings
    planInfo = buildPlanInfo(settings)
    onboardingCompleted = settings.onboardingCompleted ?? true
  }

  // メール認証状態を取得（clinic_admin のみ。運営モードでは表示しない）
  let emailVerified = true
  if (role === "clinic_admin" && !isOperatorMode) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    })
    emailVerified = !!user?.emailVerified
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

  // オンボーディング対象: clinic_admin かつ未完了かつ運営モードでない
  const showOnboarding = role === "clinic_admin" && !onboardingCompleted && !isOperatorMode && clinicId && clinicSlug

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
      {!emailVerified && <EmailVerificationBanner />}
      {showOnboarding ? (
        <OnboardingWizard clinicId={clinicId!} clinicSlug={clinicSlug!} />
      ) : (
        children
      )}
    </DashboardShell>
  )
}
