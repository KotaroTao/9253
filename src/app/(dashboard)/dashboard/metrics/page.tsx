import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getStaffMonthlyTallies, getClinicMonthlyTallyTotals } from "@/lib/queries/tallies"
import { StaffMetricsView } from "@/components/dashboard/staff-metrics-view"
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

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [staffMetrics, clinicTotals] = await Promise.all([
    getStaffMonthlyTallies(clinicId, year, month),
    getClinicMonthlyTallyTotals(clinicId, year, month),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.monthlyMetrics.title}</h1>
      <StaffMetricsView
        initialStaffMetrics={staffMetrics}
        initialClinicTotals={clinicTotals}
        initialYear={year}
        initialMonth={month}
        clinicId={clinicId}
      />
    </div>
  )
}
