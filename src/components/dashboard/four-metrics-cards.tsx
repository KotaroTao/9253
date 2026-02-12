import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricItem {
  current: number | null
  prev?: number | null
}

interface FourMetricsData {
  patientSatisfaction: MetricItem
  employeeSatisfaction: MetricItem
  maintenanceRate: MetricItem
  selfPayRate: MetricItem
}

interface FourMetricsCardsProps {
  data: FourMetricsData
}

function Delta({ current, prev }: { current: number | null; prev?: number | null }) {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) {
    return (
      <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> 0
      </span>
    )
  }
  const isUp = diff > 0
  return (
    <span
      className={`ml-1.5 inline-flex items-center gap-0.5 text-xs ${isUp ? "text-green-600" : "text-red-500"}`}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? "+" : ""}
      {diff}
    </span>
  )
}

export function FourMetricsCards({ data }: FourMetricsCardsProps) {
  const cards = [
    {
      title: messages.dashboard.satisfaction,
      value: data.patientSatisfaction.current != null && data.patientSatisfaction.current > 0
        ? data.patientSatisfaction.current.toFixed(1) : "-",
      suffix: data.patientSatisfaction.current != null && data.patientSatisfaction.current > 0 ? " / 5.0" : "",
      color: "text-blue-600",
      metric: data.patientSatisfaction,
      isScore: true,
    },
    {
      title: messages.dashboard.employeeSatisfaction,
      value: data.employeeSatisfaction.current != null
        ? data.employeeSatisfaction.current.toFixed(1) : "-",
      suffix: data.employeeSatisfaction.current != null ? " / 5.0" : "",
      color: "text-green-600",
      note: data.employeeSatisfaction.current == null ? messages.dashboard.noSurveyData : undefined,
      metric: data.employeeSatisfaction,
      isScore: true,
    },
    {
      title: messages.dashboard.maintenanceRate,
      value: data.maintenanceRate.current != null
        ? data.maintenanceRate.current.toFixed(1) : "-",
      suffix: data.maintenanceRate.current != null ? "%" : "",
      color: "text-orange-600",
      note: data.maintenanceRate.current == null ? messages.dashboard.noMetricsData : undefined,
      metric: data.maintenanceRate,
      isScore: false,
    },
    {
      title: messages.dashboard.selfPayRate,
      value: data.selfPayRate.current != null
        ? data.selfPayRate.current.toFixed(1) : "-",
      suffix: data.selfPayRate.current != null ? "%" : "",
      color: "text-purple-600",
      note: data.selfPayRate.current == null ? messages.dashboard.noMetricsData : undefined,
      metric: data.selfPayRate,
      isScore: false,
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
            <div className="flex items-baseline">
              <span className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {card.suffix}
              </span>
              <Delta current={card.metric.current} prev={card.metric.prev} />
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
