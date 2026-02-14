import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricItem {
  current: number | null
  prev?: number | null
}

interface SatisfactionCardsProps {
  data: {
    patientSatisfaction: MetricItem
  }
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

export function SatisfactionCards({ data }: SatisfactionCardsProps) {
  const { current, prev } = data.patientSatisfaction
  const value = current != null && current > 0 ? current.toFixed(1) : "-"
  const suffix = current != null && current > 0 ? " / 5.0" : ""

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {messages.dashboard.satisfaction}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-blue-600">{value}</span>
          <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
          <Delta current={current} prev={prev} />
        </div>
      </CardContent>
    </Card>
  )
}
