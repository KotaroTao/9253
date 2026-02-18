import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getSurveyResponses } from "@/lib/queries/surveys"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { VISIT_TYPES, TREATMENT_TYPES, AGE_GROUPS, GENDERS, ROLES } from "@/lib/constants"
import { Star } from "lucide-react"
import { PageSizeSelector } from "@/components/dashboard/page-size-selector"

const LABEL_MAP: Record<string, string> = Object.fromEntries([
  ...VISIT_TYPES.map((v) => [v.value, v.label]),
  ...TREATMENT_TYPES.map((v) => [v.value, v.label]),
  ...AGE_GROUPS.map((v) => [v.value, v.label]),
  ...GENDERS.map((v) => [v.value, v.label]),
])

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
            <div className="space-y-3">
              {responses.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between rounded-md border p-3 text-sm"
                >
                  <div className="space-y-1">
                    {(() => {
                      const pa = r.patientAttributes as Record<string, string> | null
                      return pa ? (
                        <div className="flex flex-wrap gap-1">
                          {["visitType", "treatmentType", "ageGroup", "gender"].map((key) => {
                            const val = pa[key]
                            if (!val) return null
                            return (
                              <span key={key} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                                {LABEL_MAP[val] ?? val}
                              </span>
                            )
                          })}
                        </div>
                      ) : null
                    })()}
                    {r.freeText && (
                      <p className="text-muted-foreground">{r.freeText}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {messages.dashboard.templateLabel}: {r.template.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {r.overallScore !== null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {r.overallScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.respondedAt).toLocaleDateString("ja-JP")}{" "}
                      {new Date(r.respondedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
