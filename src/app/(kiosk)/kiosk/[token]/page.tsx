import { notFound } from "next/navigation"
import { getStaffByToken } from "@/lib/queries/surveys"
import { prisma } from "@/lib/prisma"
import { KioskSurvey } from "@/components/survey/kiosk-survey"
import { messages } from "@/lib/messages"
import type { SurveyPageData } from "@/types/survey"

interface KioskPageProps {
  params: { token: string }
}

export default async function KioskPage({ params }: KioskPageProps) {
  const staff = await getStaffByToken(params.token)

  if (!staff || !staff.clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-xl font-bold">{messages.survey.invalidQr}</h1>
          <p className="text-muted-foreground">{messages.survey.invalidQrSub}</p>
        </div>
      </div>
    )
  }

  const template = staff.clinic.surveyTemplates[0]
  if (!template) {
    return notFound()
  }

  // Count today's responses for this staff
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayCount = await prisma.surveyResponse.count({
    where: {
      staffId: staff.id,
      respondedAt: { gte: todayStart },
    },
  })

  const pageData: SurveyPageData = {
    staffName: staff.name,
    clinicName: staff.clinic.name,
    templateId: template.id,
    questions: template.questions as SurveyPageData["questions"],
    qrToken: params.token,
  }

  return (
    <KioskSurvey
      data={pageData}
      initialTodayCount={todayCount}
    />
  )
}
