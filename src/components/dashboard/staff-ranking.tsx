import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import { Star } from "lucide-react"
import type { StaffRankingEntry } from "@/types"

interface StaffRankingProps {
  ranking: StaffRankingEntry[]
}

export function StaffRanking({ ranking }: StaffRankingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {messages.dashboard.staffRanking}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {messages.common.noData}
          </p>
        ) : (
          <div className="space-y-3">
            {ranking.map((s, i) => (
              <div
                key={s.staffId}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {STAFF_ROLE_LABELS[s.role] ?? s.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{s.avgScore.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {s.responseCount}{messages.common.countSuffix}
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
