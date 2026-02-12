import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"

interface FourMetricsData {
  patientSatisfaction: number
  employeeSatisfaction: number | null
  maintenanceRate: number | null
  selfPayRate: number | null
}

interface FourMetricsCardsProps {
  data: FourMetricsData
}

export function FourMetricsCards({ data }: FourMetricsCardsProps) {
  const cards = [
    {
      title: messages.dashboard.satisfaction,
      value: data.patientSatisfaction > 0 ? data.patientSatisfaction.toFixed(1) : "-",
      suffix: data.patientSatisfaction > 0 ? " / 5.0" : "",
      color: "text-blue-600",
    },
    {
      title: messages.dashboard.employeeSatisfaction,
      value: data.employeeSatisfaction != null ? data.employeeSatisfaction.toFixed(1) : "-",
      suffix: data.employeeSatisfaction != null ? " / 5.0" : "",
      color: "text-green-600",
      note: data.employeeSatisfaction == null ? messages.dashboard.noSurveyData : undefined,
    },
    {
      title: messages.dashboard.maintenanceRate,
      value: data.maintenanceRate != null ? data.maintenanceRate.toFixed(1) : "-",
      suffix: data.maintenanceRate != null ? "%" : "",
      color: "text-orange-600",
      note: data.maintenanceRate == null ? messages.dashboard.noMetricsData : undefined,
    },
    {
      title: messages.dashboard.selfPayRate,
      value: data.selfPayRate != null ? data.selfPayRate.toFixed(1) : "-",
      suffix: data.selfPayRate != null ? "%" : "",
      color: "text-purple-600",
      note: data.selfPayRate == null ? messages.dashboard.noMetricsData : undefined,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
              <span className="text-sm font-normal text-muted-foreground">
                {card.suffix}
              </span>
            </div>
            {card.note && (
              <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
