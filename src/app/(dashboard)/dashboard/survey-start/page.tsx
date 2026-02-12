import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SurveyStaffSelector } from "@/components/survey/survey-staff-selector"
import { messages } from "@/lib/messages"
import type { SurveyPageData } from "@/types/survey"

export default async function SurveyStartPage() {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId

  const [clinic, staffList] = await Promise.all([
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
  ])

  if (!clinic) {
    redirect("/login")
  }

  const template = clinic.surveyTemplates[0]

  if (!template) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{messages.nav.surveyStart}</h1>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            アンケートテンプレートが設定されていません
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.nav.surveyStart}</h1>
      <SurveyStaffSelector
        staffList={staffList}
        clinicName={clinic.name}
        templateId={template.id}
        questions={template.questions as SurveyPageData["questions"]}
        enableReviewRequest={clinic.enableReviewRequest}
        googleReviewUrl={clinic.googleReviewUrl}
      />
    </div>
  )
}
