import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getDashboardStats } from "@/lib/queries/stats"
import { getMonthlyTrend } from "@/lib/queries/stats"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { RecentResponses } from "@/components/dashboard/recent-responses"
import { StaffRanking } from "@/components/dashboard/staff-ranking"
import { messages } from "@/lib/messages"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const [stats, monthlyTrend] = await Promise.all([
    getDashboardStats(clinicId),
    getMonthlyTrend(clinicId),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.dashboard.title}</h1>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyChart data={monthlyTrend} />
        <StaffRanking ranking={stats.staffRanking} />
      </div>

      <RecentResponses responses={stats.recentResponses} />
    </div>
  )
}
