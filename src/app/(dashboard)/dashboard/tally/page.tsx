import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TallyStaffSelector } from "@/components/tally/tally-staff-selector"
import { messages } from "@/lib/messages"

export default async function DashboardTallyPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const staffList = await prisma.staff.findMany({
    where: { clinicId: session.user.clinicId, isActive: true },
    select: { id: true, name: true, role: true, qrToken: true },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.tally.title}</h1>
      <TallyStaffSelector staffList={staffList} />
    </div>
  )
}
