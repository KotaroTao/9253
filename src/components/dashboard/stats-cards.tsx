import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import type { DashboardStats } from "@/types"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: messages.dashboard.satisfaction,
      value: stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "-",
      suffix: stats.averageScore > 0 ? " / 5.0" : "",
    },
    {
      title: messages.dashboard.responseCount,
      value: stats.totalResponses.toLocaleString(),
      suffix: " 件",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.value}
              <span className="text-sm font-normal text-muted-foreground">
                {card.suffix}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
