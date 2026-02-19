"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import {
  VISIT_TYPES,
  INSURANCE_TYPES,
  INSURANCE_PURPOSES,
  SELF_PAY_PURPOSES,
  TREATMENT_TYPES,
  AGE_GROUPS,
  GENDERS,
} from "@/lib/constants"
import { Star, ChevronDown, Loader2 } from "lucide-react"

const LABEL_MAP: Record<string, string> = Object.fromEntries([
  ...VISIT_TYPES.map((v) => [v.value, v.label]),
  ...INSURANCE_TYPES.map((v) => [v.value, v.label]),
  ...INSURANCE_PURPOSES.map((v) => [v.value, v.label]),
  ...SELF_PAY_PURPOSES.map((v) => [v.value, v.label]),
  // Legacy
  ...TREATMENT_TYPES.map((v) => [v.value, v.label]),
  ...AGE_GROUPS.map((v) => [v.value, v.label]),
  ...GENDERS.map((v) => [v.value, v.label]),
])

interface ResponseItem {
  id: string
  overallScore: number | null
  freeText: string | null
  patientAttributes?: unknown
  respondedAt: Date | string
  staff: { name: string; role: string } | null
}

interface RecentResponsesProps {
  responses: ResponseItem[]
  initialHasMore?: boolean
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("ja-JP") + " " + d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
}

export function RecentResponses({ responses: initialResponses, initialHasMore = true }: RecentResponsesProps) {
  const [responses, setResponses] = useState<ResponseItem[]>(initialResponses)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recent-responses?offset=${responses.length}`)
      if (res.ok) {
        const data = await res.json()
        setResponses((prev) => [...prev, ...data.items])
        setHasMore(data.hasMore)
      }
    } finally {
      setLoading(false)
    }
  }, [responses.length])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {messages.dashboard.recentSurveys}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
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
                    const pa = r.patientAttributes as Record<string, string> | null | undefined
                    return pa ? (
                      <div className="flex flex-wrap gap-1">
                        {["visitType", "insuranceType", "purpose", "treatmentType", "ageGroup", "gender"].map((key) => {
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
                    {formatDateTime(r.respondedAt)}
                  </span>
                </div>
              </div>
            ))}
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                {loading ? "読み込み中..." : "もっと見る"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
