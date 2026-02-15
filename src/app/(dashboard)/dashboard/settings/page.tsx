import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminMode } from "@/lib/admin-mode"
import { getClinicById } from "@/lib/queries/clinics"
import { SettingsForm } from "@/components/settings/settings-form"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const adminMode = isAdminMode()
  if (!adminMode && session.user.role !== "system_admin") {
    redirect("/dashboard")
  }

  const clinic = await getClinicById(session.user.clinicId)
  if (!clinic) {
    redirect("/dashboard")
  }

  const settings = ((clinic as { settings?: unknown }).settings ?? {}) as ClinicSettings
  const hasAdminPassword = !!settings.adminPassword
  const workingDaysPerWeek = settings.workingDaysPerWeek ?? 6

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.settings.title}</h1>
      <SettingsForm clinic={clinic} hasAdminPassword={hasAdminPassword} workingDaysPerWeek={workingDaysPerWeek} />
    </div>
  )
}
