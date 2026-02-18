import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getStaffWithStats } from "@/lib/queries/staff"
import { StaffList } from "@/components/staff/staff-list"

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

  // ロールベースでアクセス制御（clinic_admin / system_admin のみ）
  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  const staffList = await getStaffWithStats(clinicId)

  return (
    <div className="space-y-6">
      <StaffList
        staffList={staffList}
        clinicId={clinicId}
      />
    </div>
  )
}
