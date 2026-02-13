import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdminMode } from "@/lib/admin-mode"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { role, clinicId } = session.user

  // system_admin with no clinicId can still access dashboard
  // clinic_admin and staff must have a clinicId
  if ((role === "clinic_admin" || role === "staff") && !clinicId) {
    redirect("/login")
  }

  let clinicName: string | undefined
  let hasAdminPassword = false
  if (clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, settings: true },
    })
    clinicName = clinic?.name ?? undefined
    const settings = clinic?.settings as Record<string, unknown> | null
    hasAdminPassword = !!settings?.adminPassword
  }

  const adminMode = isAdminMode()

  return (
    <DashboardShell
      role={role}
      userName={session.user.name ?? ""}
      clinicName={clinicName}
      isAdminMode={adminMode}
      hasAdminPassword={hasAdminPassword}
    >
      {children}
    </DashboardShell>
  )
}
