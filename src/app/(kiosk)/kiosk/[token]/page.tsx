import { notFound } from "next/navigation"
import { getClinicBySlug } from "@/lib/queries/surveys"
import { prisma } from "@/lib/prisma"
import { KioskSurvey } from "@/components/survey/kiosk-survey"
import { messages } from "@/lib/messages"
import type { SurveyPageData, SurveyTemplateInfo, KioskStaffInfo } from "@/types/survey"

interface KioskPageProps {
  params: { token: string }
}

export default async function KioskPage({ params }: KioskPageProps) {
  const slug = decodeURIComponent(params.token)
  const clinic = await getClinicBySlug(slug)

  if (!clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-xl font-bold">{messages.survey.invalidLink}</h1>
          <p className="text-muted-foreground">{messages.survey.invalidLinkSub}</p>
        </div>
      </div>
    )
  }

  if (clinic.surveyTemplates.length === 0) {
    return notFound()
  }

  // Count today's responses and load active staff for this clinic
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [todayCount, staffList] = await Promise.all([
    prisma.surveyResponse.count({
      where: {
        clinicId: clinic.id,
        respondedAt: { gte: todayStart },
      },
    }),
    prisma.staff.findMany({
      where: { clinicId: clinic.id, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const templates: SurveyTemplateInfo[] = clinic.surveyTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    questions: t.questions as SurveyPageData["questions"],
  }))

  const staff: KioskStaffInfo[] = staffList.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
  }))

  return (
    <KioskSurvey
      clinicName={clinic.name}
      clinicSlug={clinic.slug}
      templates={templates}
      initialTodayCount={todayCount}
      staff={staff}
    />
  )
}
