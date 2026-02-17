import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminMode, getOperatorClinicId } from "@/lib/admin-mode"
import { getStaffWithStats } from "@/lib/queries/staff"
import { StaffList } from "@/components/staff/staff-list"
import { messages } from "@/lib/messages"
import { ROLES } from "@/lib/constants"

export default async function StaffPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const adminMode = isAdminMode()
  if (!adminMode && session.user.role !== "system_admin") {
    redirect("/dashboard")
  }

  const staffList = await getStaffWithStats(clinicId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{messages.staff.management}</h1>
      </div>
      <StaffList
        staffList={staffList}
        clinicId={clinicId}
      />
    </div>
  )
}
