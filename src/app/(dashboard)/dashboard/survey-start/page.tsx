import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SurveyKioskLauncher } from "@/components/survey/survey-kiosk-launcher"
import { messages } from "@/lib/messages"

export default async function SurveyStartPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId
  const isStaff = session.user.role === "staff"

  // Today start for counting responses
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [clinic, staffList, todayCounts] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        surveyTemplates: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.staff.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, name: true, role: true, qrToken: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.surveyResponse.groupBy({
      by: ["staffId"],
      where: { clinicId, respondedAt: { gte: todayStart } },
      _count: { _all: true },
    }),
  ])

  if (!clinic) {
    redirect("/login")
  }

  const countMap = new Map(todayCounts.map((c) => [c.staffId, c._count._all]))
  const staffListWithCounts = staffList.map((s) => ({
    ...s,
    todayCount: countMap.get(s.id) ?? 0,
  }))

  const template = clinic.surveyTemplates[0]

  if (!template) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{messages.nav.surveyStart}</h1>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {messages.nav.noTemplate}
          </p>
        </div>
      </div>
    )
  }

  // Staff: auto-select own record
  const autoSelectedToken = isStaff && session.user.staffId
    ? staffList.find((s) => s.id === session.user.staffId)?.qrToken ?? null
    : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.nav.surveyStart}</h1>
      <SurveyKioskLauncher
        staffList={staffListWithCounts}
        autoSelectedToken={autoSelectedToken}
      />
    </div>
  )
}
