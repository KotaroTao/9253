import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getClinicById } from "@/lib/queries/clinics"
import { SettingsForm } from "@/components/settings/settings-form"
import { ROLES } from "@/lib/constants"
import type { ClinicSettings } from "@/types"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  const clinic = await getClinicById(clinicId)
  if (!clinic) {
    redirect("/dashboard")
  }

  const settings = ((clinic as { settings?: unknown }).settings ?? {}) as ClinicSettings
  const regularClosedDays = settings.regularClosedDays ?? []

  return (
    <div className="space-y-6">
      <SettingsForm
        clinic={clinic}
        regularClosedDays={regularClosedDays}
        googleReviewEnabled={settings.googleReviewEnabled}
        googleReviewUrl={settings.googleReviewUrl}
      />
    </div>
  )
}
