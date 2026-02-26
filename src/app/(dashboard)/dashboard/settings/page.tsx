import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getClinicById } from "@/lib/queries/clinics"
import { SettingsForm } from "@/components/settings/settings-form"
import { MetricsPinSettings } from "@/components/settings/metrics-pin-settings"
import { ROLES } from "@/lib/constants"
import { messages } from "@/lib/messages"
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
        postSurveyAction={settings.postSurveyAction}
        lineUrl={settings.lineUrl}
        clinicHomepageUrl={settings.clinicHomepageUrl}
        clinicType={settings.clinicType}
      />
      <MetricsPinSettings hasPin={!!settings.metricsPin} />
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">{messages.nav.testSurvey}</h3>
            <p className="text-xs text-muted-foreground">{messages.settings.testSurveyDesc}</p>
          </div>
          <Link
            href="/dashboard/test"
            className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            {messages.settings.testSurveyLink}
          </Link>
        </div>
      </div>
    </div>
  )
}
