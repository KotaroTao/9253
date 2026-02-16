import Link from "next/link"
import { Suspense } from "react"
import { getAllClinics } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Lightbulb, HardDrive, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { ClinicSearch } from "@/components/admin/clinic-search"
import { OperatorLoginButton } from "@/components/admin/operator-login-button"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const search = params.search ?? ""
  const [{ clinics, total, totalPages }, totalResponsesResult] = await Promise.all([
    getAllClinics({ page, limit: 20, search }),
    // Use reltuples estimate for platform-wide count (avoids full table scan on 10M+ rows)
    prisma.$queryRaw<Array<{ estimate: bigint }>>`
      SELECT GREATEST(
        (SELECT reltuples::bigint FROM pg_class WHERE relname = 'survey_responses'),
        0
      ) AS estimate
    `,
  ])
  const totalResponses = Number(totalResponsesResult[0]?.estimate ?? 0)

  // ページネーションURLヘルパー（検索パラメータを保持）
  function paginationHref(targetPage: number) {
    const params = new URLSearchParams()
    if (targetPage > 1) params.set("page", String(targetPage))
    if (search) params.set("search", search)
    const qs = params.toString()
    return `/admin${qs ? `?${qs}` : ""}`
  }

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

      {/* Management links */}
      <div className="space-y-3">
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

        <Link
          href="/admin/backups"
          className="flex items-center justify-between rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/80 to-white p-4 transition-colors hover:border-blue-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{messages.backup.title}</p>
              <p className="text-xs text-muted-foreground">{messages.backup.description}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      {/* Clinic list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              {messages.admin.clinicList}
            </CardTitle>
            <div className="w-full sm:w-72">
              <Suspense>
                <ClinicSearch />
              </Suspense>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {search ? `「${search}」に一致するクリニックはありません` : messages.common.noData}
            </p>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{clinic.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      /{clinic.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden gap-6 text-right text-sm sm:flex">
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
                    <OperatorLoginButton clinicId={clinic.id} />
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
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link
                    href={paginationHref(page - 1)}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    前へ
                  </Link>
                )}
                {/* ページ番号ボタン */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // 最初・最後・現在ページの前後1を表示
                    if (p === 1 || p === totalPages) return true
                    if (Math.abs(p - page) <= 1) return true
                    return false
                  })
                  .reduce<Array<number | "ellipsis">>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push("ellipsis")
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`e${idx}`} className="px-1.5 text-xs text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={paginationHref(item as number)}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                          item === page
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-muted"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}
                {page < totalPages && (
                  <Link
                    href={paginationHref(page + 1)}
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
