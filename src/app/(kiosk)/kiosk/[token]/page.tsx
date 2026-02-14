import { notFound } from "next/navigation"
import { getClinicBySlug } from "@/lib/queries/surveys"
import { prisma } from "@/lib/prisma"
import { KioskSurvey } from "@/components/survey/kiosk-survey"
import { messages } from "@/lib/messages"
import type { SurveyPageData, SurveyTemplateInfo } from "@/types/survey"

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

  // Count today's responses for this clinic
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayCount = await prisma.surveyResponse.count({
    where: {
      clinicId: clinic.id,
      respondedAt: { gte: todayStart },
    },
  })

  const templates: SurveyTemplateInfo[] = clinic.surveyTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    questions: t.questions as SurveyPageData["questions"],
  }))

  return (
    <KioskSurvey
      clinicName={clinic.name}
      clinicSlug={clinic.slug}
      templates={templates}
      initialTodayCount={todayCount}
    />
  )
}
