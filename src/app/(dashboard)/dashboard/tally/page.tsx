import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TallyStaffSelector } from "@/components/tally/tally-staff-selector"
import { TallyTapUI } from "@/components/tally/tally-tap-ui"
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

  const isStaff = session.user.role === "staff"

  // Staff: auto-select own record, skip the selector
  if (isStaff && session.user.staffId) {
    const myStaff = staffList.find((s) => s.id === session.user.staffId)
    if (myStaff) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{messages.tally.title}</h1>
          <div className="mx-auto max-w-sm">
            <TallyTapUI staffName={myStaff.name} staffToken={myStaff.qrToken} />
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.tally.title}</h1>
      <TallyStaffSelector staffList={staffList} />
    </div>
  )
}
