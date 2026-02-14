import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS, VISIT_TYPES, TREATMENT_TYPES, AGE_GROUPS, GENDERS } from "@/lib/constants"
import { Star } from "lucide-react"

const LABEL_MAP: Record<string, string> = Object.fromEntries([
  ...VISIT_TYPES.map((v) => [v.value, v.label]),
  ...TREATMENT_TYPES.map((v) => [v.value, v.label]),
  ...AGE_GROUPS.map((v) => [v.value, v.label]),
  ...GENDERS.map((v) => [v.value, v.label]),
])

interface RecentResponsesProps {
  responses: {
    id: string
    overallScore: number | null
    freeText: string | null
    patientAttributes?: unknown
    respondedAt: Date | string
    staff: { name: string; role: string } | null
  }[]
}

export function RecentResponses({ responses }: RecentResponsesProps) {
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
