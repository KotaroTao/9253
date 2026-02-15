import Link from "next/link"
import { getAllClinics } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Lightbulb, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const [{ clinics, total, totalPages }, totalResponsesResult] = await Promise.all([
    getAllClinics({ page, limit: 20 }),
    // Use reltuples estimate for platform-wide count (avoids full table scan on 10M+ rows)
    prisma.$queryRaw<Array<{ estimate: bigint }>>`
      SELECT GREATEST(
        (SELECT reltuples::bigint FROM pg_class WHERE relname = 'survey_responses'),
        0
      ) AS estimate
    `,
  ])
  const totalResponses = Number(totalResponsesResult[0]?.estimate ?? 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.admin.title}</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {messages.admin.clinicCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {messages.admin.totalResponses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalResponses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tip Management link */}
      <Link
        href="/admin/tips"
        className="flex items-center justify-between rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50/80 to-white p-4 transition-colors hover:border-amber-300 hover:shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{messages.tipManager.title}</p>
            <p className="text-xs text-muted-foreground">{messages.tipManager.description}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>

      {/* Clinic list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {messages.admin.clinicList}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {messages.common.noData}
            </p>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div>
                    <h3 className="font-medium">{clinic.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      /{clinic.slug}
                    </p>
                  </div>
                  <div className="flex gap-6 text-right text-sm">
                    <div>
                      <p className="font-medium">{clinic._count.staff}</p>
                      <p className="text-xs text-muted-foreground">{messages.common.staffLabel}</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {clinic._count.surveyResponses}
                      </p>
                      <p className="text-xs text-muted-foreground">{messages.common.responseCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                {total}件中 {(page - 1) * 20 + 1}〜{Math.min(page * 20, total)}件
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin?page=${page - 1}`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    前へ
                  </Link>
                )}
                <span className="inline-flex items-center px-2 text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/admin?page=${page + 1}`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    次へ
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
