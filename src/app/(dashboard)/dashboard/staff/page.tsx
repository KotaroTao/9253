import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getStaffWithStats } from "@/lib/queries/staff"
import { StaffList } from "@/components/staff/staff-list"
import { messages } from "@/lib/messages"

export const metadata: Metadata = {
  title: "スタッフ管理 | MIERU Clinic",
}

export default async function StaffPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const staffList = await getStaffWithStats(session.user.clinicId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{messages.staff.management}</h1>
      </div>
      <StaffList
        staffList={staffList}
        clinicId={session.user.clinicId}
      />
    </div>
  )
}
