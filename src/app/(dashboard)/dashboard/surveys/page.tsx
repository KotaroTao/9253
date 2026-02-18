import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getSurveyResponses } from "@/lib/queries/surveys"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { ROLES } from "@/lib/constants"
import { PageSizeSelector } from "@/components/dashboard/page-size-selector"
import { SurveyResponseList } from "@/components/dashboard/survey-response-list"

const ALLOWED_LIMITS = [10, 20, 50] as const

interface SurveysPageProps {
  searchParams: { page?: string; limit?: string }
}

export default async function SurveysPage({ searchParams }: SurveysPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  const page = Number(searchParams.page) || 1
  const rawLimit = Number(searchParams.limit) || 20
  const limit = ALLOWED_LIMITS.includes(rawLimit as typeof ALLOWED_LIMITS[number]) ? rawLimit : 20

  const { responses, total, totalPages } = await getSurveyResponses(
    clinicId,
    { page, limit }
  )

  function buildUrl(params: { page?: number; limit?: number }) {
    const p = params.page ?? page
    const l = params.limit ?? limit
    const qs = new URLSearchParams()
    qs.set("page", String(p))
    if (l !== 20) qs.set("limit", String(l))
    return `/dashboard/surveys?${qs.toString()}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {messages.dashboard.recentSurveys}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {total}{messages.common.countSuffix}
              </span>
            </CardTitle>
            <PageSizeSelector currentLimit={limit} basePath="/dashboard/surveys" />
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {messages.common.noData}
            </p>
          ) : (
            <SurveyResponseList responses={responses} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: page - 1 })}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                >
                  {messages.common.back}
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: page + 1 })}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                >
                  {messages.common.next}
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
