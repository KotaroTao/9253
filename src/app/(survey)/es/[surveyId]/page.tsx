import { notFound } from "next/navigation"
import { getStaffSurveyById } from "@/lib/queries/staff-surveys"
import { StaffSurveyForm } from "@/components/survey/staff-survey-form"
import { messages } from "@/lib/messages"

interface StaffSurveyPageProps {
  params: { surveyId: string }
}

export default async function StaffSurveyPage({ params }: StaffSurveyPageProps) {
  const survey = await getStaffSurveyById(params.surveyId)

  if (!survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">😔</div>
          <h1 className="mb-2 text-xl font-bold">{messages.staffSurvey.notFound}</h1>
          <p className="text-muted-foreground">{messages.staffSurvey.notFoundSub}</p>
        </div>
      </div>
    )
  }

  if (survey.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">📋</div>
          <h1 className="mb-2 text-xl font-bold">{messages.staffSurvey.expired}</h1>
          <p className="text-muted-foreground">{messages.staffSurvey.expiredSub}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md">
        <StaffSurveyForm surveyId={survey.id} />
      </div>
    </div>
  )
}
