"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SurveyResponseList } from "@/components/dashboard/survey-response-list"
import { messages } from "@/lib/messages"

interface ResponseItem {
  id: string
  overallScore: number | null
  freeText: string | null
  patientAttributes?: unknown
  respondedAt: Date | string
  staff: { name: string; role: string } | null
  template: { name: string }
}

interface SurveyResponseSectionProps {
  initialResponses: ResponseItem[]
  total: number
  initialPage: number
  limit: number
}

export function SurveyResponseSection({
  initialResponses,
  total,
  initialPage,
  limit,
}: SurveyResponseSectionProps) {
  const router = useRouter()
  const [responses, setResponses] = useState<ResponseItem[]>(initialResponses)
  const [totalCount, setTotalCount] = useState(total)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const hasMore = responses.length < totalCount

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/surveys?page=${nextPage}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setResponses((prev) => [...prev, ...data.responses])
        setPage(nextPage)
      }
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/surveys/${id}`, { method: "DELETE" })
    if (res.ok) {
      setResponses((prev) => prev.filter((r) => r.id !== id))
      setTotalCount((prev) => prev - 1)
      router.refresh()
      return true
    }
    return false
  }, [router])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {messages.nav.surveys}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {totalCount}{messages.common.countSuffix}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {messages.common.noData}
          </p>
        ) : (
          <SurveyResponseList responses={responses} onDelete={handleDelete} />
        )}

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {messages.common.loading}
                </>
              ) : (
                `もっと表示（残り${totalCount - responses.length}件）`
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
