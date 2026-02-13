import { notFound } from "next/navigation"
import { getStaffByToken } from "@/lib/queries/surveys"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import type { SurveyPageData } from "@/types/survey"

interface SurveyPageProps {
  params: { token: string }
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const token = decodeURIComponent(params.token)
  const staff = await getStaffByToken(token)

  if (!staff || !staff.clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">😔</div>
          <h1 className="mb-2 text-xl font-bold">{messages.survey.invalidLink}</h1>
          <p className="text-muted-foreground">{messages.survey.invalidLinkSub}</p>
        </div>
      </div>
    )
  }

  const template = staff.clinic.surveyTemplates[0]
  if (!template) {
    return notFound()
  }

  const pageData: SurveyPageData = {
    staffName: staff.name,
    clinicName: staff.clinic.name,
    templateId: template.id,
    questions: template.questions as SurveyPageData["questions"],
    qrToken: token,
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md">
        <SurveyForm data={pageData} />
      </div>
    </div>
  )
}
