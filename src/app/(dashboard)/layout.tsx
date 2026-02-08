import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
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
  // clinic_admin must have a clinicId
  if (role === "clinic_admin" && !clinicId) {
    redirect("/login")
  }

  let clinicName: string | undefined
  if (clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    })
    clinicName = clinic?.name ?? undefined
  }

  return (
    <DashboardShell
      role={role}
      userName={session.user.name ?? ""}
      clinicName={clinicName}
    >
      {children}
    </DashboardShell>
  )
}
