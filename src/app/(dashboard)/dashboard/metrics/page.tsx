import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { MonthlyMetricsView } from "@/components/dashboard/monthly-metrics-view"
import { ROLES } from "@/lib/constants"

export default async function MetricsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Fetch entered months for the last 6 months (for alert)
  const monthKeys: { year: number; month: number }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(year, month - 1 - i, 1)
    monthKeys.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const enteredRows = await prisma.monthlyClinicMetrics.findMany({
    where: {
      clinicId,
      OR: monthKeys.map((k) => ({ year: k.year, month: k.month })),
    },
    select: { year: true, month: true },
  })

  const enteredMonths = enteredRows.map((r) => `${r.year}-${r.month}`)

  return (
    <div className="space-y-6">
      <MonthlyMetricsView enteredMonths={enteredMonths} />
    </div>
  )
}
