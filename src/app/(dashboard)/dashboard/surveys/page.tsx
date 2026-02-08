import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getSurveyResponses } from "@/lib/queries/surveys"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import { Star } from "lucide-react"

interface SurveysPageProps {
  searchParams: { page?: string }
}

export default async function SurveysPage({ searchParams }: SurveysPageProps) {
  const session = await auth()

  if (!session?.user?.clinicId) {
    redirect("/login")
  }

  const page = Number(searchParams.page) || 1
  const { responses, total, totalPages } = await getSurveyResponses(
    session.user.clinicId,
    { page, limit: 20 }
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{messages.nav.surveys}</h1>
        <p className="text-sm text-muted-foreground">
          全 {total} 件
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {messages.dashboard.recentSurveys}
          </CardTitle>
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.staff.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {STAFF_ROLE_LABELS[r.staff.role] ?? r.staff.role}
                      </span>
                    </div>
                    {r.freeText && (
                      <p className="text-muted-foreground">{r.freeText}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      テンプレート: {r.template.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {r.overallScore !== null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {r.overallScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.respondedAt).toLocaleDateString("ja-JP")}
                    </span>
                    {r.reviewClicked && (
                      <span className="text-xs text-primary">
                        レビュー済み
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/dashboard/surveys?page=${page - 1}`}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                >
                  {messages.common.back}
                </a>
              )}
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={`/dashboard/surveys?page=${page + 1}`}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
                >
                  {messages.common.next}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
