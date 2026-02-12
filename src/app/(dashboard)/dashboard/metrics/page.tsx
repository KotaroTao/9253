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

  const prevDate = new Date(year, month - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  const [staffMetrics, clinicTotals, prevTotals] = await Promise.all([
    getStaffMonthlyTallies(clinicId, year, month),
    getClinicMonthlyTallyTotals(clinicId, year, month),
    getClinicMonthlyTallyTotals(clinicId, prevYear, prevMonth),
  ])

  const hasPrev = prevTotals.newPatientCount > 0 || prevTotals.selfPayProposalCount > 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.monthlyMetrics.title}</h1>
      <StaffMetricsView
        initialStaffMetrics={staffMetrics}
        initialClinicTotals={clinicTotals}
        initialPrevTotals={hasPrev ? prevTotals : null}
        initialYear={year}
        initialMonth={month}
        clinicId={clinicId}
      />
    </div>
  )
}
