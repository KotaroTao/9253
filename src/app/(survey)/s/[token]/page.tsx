import { notFound } from "next/navigation"
import { getClinicBySlug } from "@/lib/queries/surveys"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import type { SurveyPageData } from "@/types/survey"
import type { ClinicSettings, PostSurveyLinks } from "@/types"

interface SurveyPageProps {
  params: { token: string }
  searchParams: { t?: string; test?: string }
}

export default async function SurveyPage({ params, searchParams }: SurveyPageProps) {
  const slug = decodeURIComponent(params.token)
  const clinic = await getClinicBySlug(slug)

  if (!clinic) {
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

  const isTestMode = searchParams.test === "1"
  const templateId = searchParams.t
  const template = templateId
    ? clinic.surveyTemplates.find((t) => t.id === templateId)
    : clinic.surveyTemplates[0]

  if (!template) {
    return notFound()
  }

  const pageData: SurveyPageData = {
    clinicName: clinic.name,
    clinicSlug: clinic.slug,
    templateId: template.id,
    templateName: template.name,
    questions: template.questions as unknown as SurveyPageData["questions"],
  }

  // アンケート完了後の誘導リンク
  const settings = (clinic.settings ?? {}) as ClinicSettings
  const postSurveyLinks: PostSurveyLinks = {
    lineUrl: settings.postSurveyAction === "line" && settings.lineUrl
      ? settings.lineUrl : undefined,
    clinicHomepageUrl: settings.clinicHomepageUrl || undefined,
  }
  const hasLinks = postSurveyLinks.lineUrl || postSurveyLinks.clinicHomepageUrl

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md">
        <SurveyForm data={pageData} postSurveyLinks={hasLinks ? postSurveyLinks : undefined} isTestMode={isTestMode} />
      </div>
    </div>
  )
}
