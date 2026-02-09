import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getClinicById } from "@/lib/queries/clinics"
import { SettingsForm } from "@/components/settings/settings-form"
import { messages } from "@/lib/messages"

export const metadata: Metadata = {
  title: "設定 | MIERU Clinic",
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const clinic = await getClinicById(session.user.clinicId)
  if (!clinic) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.settings.title}</h1>
      <SettingsForm clinic={clinic} />
    </div>
  )
}
