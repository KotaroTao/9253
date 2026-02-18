import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getClinicById } from "@/lib/queries/clinics"
import { SettingsForm } from "@/components/settings/settings-form"
import { messages } from "@/lib/messages"
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
  const workingDaysPerWeek = settings.workingDaysPerWeek ?? 6
  const regularClosedDays = settings.regularClosedDays ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.settings.title}</h1>
      <SettingsForm clinic={clinic} workingDaysPerWeek={workingDaysPerWeek} regularClosedDays={regularClosedDays} />
    </div>
  )
}
