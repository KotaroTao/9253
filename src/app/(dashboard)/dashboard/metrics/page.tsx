import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getMonthlyMetrics } from "@/lib/queries/monthly-metrics"
import { MonthlyMetricsForm } from "@/components/dashboard/monthly-metrics-form"
import { messages } from "@/lib/messages"

export default async function MetricsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const metrics = await getMonthlyMetrics(clinicId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.monthlyMetrics.title}</h1>
      <MonthlyMetricsForm initialMetrics={metrics} />
    </div>
  )
}
