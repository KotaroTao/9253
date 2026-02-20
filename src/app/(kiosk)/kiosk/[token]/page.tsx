import { notFound } from "next/navigation"
import { getClinicBySlug } from "@/lib/queries/surveys"
import { prisma } from "@/lib/prisma"
import { KioskSurvey } from "@/components/survey/kiosk-survey"
import { messages } from "@/lib/messages"
import type { SurveyPageData, SurveyTemplateInfo, KioskStaffInfo } from "@/types/survey"
import type { ClinicSettings, PostSurveyLinks } from "@/types"

interface KioskPageProps {
  params: { token: string }
  searchParams: { test?: string }
}

export default async function KioskPage({ params, searchParams }: KioskPageProps) {
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
    questions: t.questions as unknown as SurveyPageData["questions"],
  }))

  const staff: KioskStaffInfo[] = staffList.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
  }))

  // アンケート完了後の誘導リンク
  const clinicSettings = (clinic.settings ?? {}) as ClinicSettings
  const postSurveyLinks: PostSurveyLinks = {
    googleReviewUrl: clinicSettings.postSurveyAction === "google_review" && clinicSettings.googleReviewUrl
      ? clinicSettings.googleReviewUrl : undefined,
    lineUrl: clinicSettings.postSurveyAction === "line" && clinicSettings.lineUrl
      ? clinicSettings.lineUrl : undefined,
    clinicHomepageUrl: clinicSettings.clinicHomepageUrl || undefined,
  }
  const hasLinks = postSurveyLinks.googleReviewUrl || postSurveyLinks.lineUrl || postSurveyLinks.clinicHomepageUrl

  const isTestMode = searchParams.test === "1"

  return (
    <KioskSurvey
      clinicName={clinic.name}
      clinicSlug={clinic.slug}
      templates={templates}
      initialTodayCount={todayCount}
      staff={staff}
      postSurveyLinks={hasLinks ? postSurveyLinks : undefined}
      isTestMode={isTestMode}
    />
  )
}
