"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import type { FourMetricsTrend } from "@/types"

interface FourMetricsTrendChartProps {
  data: FourMetricsTrend[]
}

export function FourMetricsTrendChart({ data }: FourMetricsTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{messages.dashboard.fourMetricsTrend}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {messages.common.noData}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Normalize: satisfaction scores are 1-5, rates are 0-100%
  // We'll use dual Y-axes
  const hasRateData = data.some(
    (d) => d.maintenanceRate != null || d.selfPayRate != null
  )
  const hasSatisfactionData = data.some(
    (d) => d.patientSatisfaction != null || d.employeeSatisfaction != null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{messages.dashboard.fourMetricsTrend}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            {hasSatisfactionData && (
              <YAxis
                yAxisId="score"
                domain={[1, 5]}
                fontSize={10}
                label={{ value: "スコア", angle: -90, position: "insideLeft", fontSize: 10 }}
              />
            )}
            {hasRateData && (
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                fontSize={10}
                label={{ value: "%", angle: 90, position: "insideRight", fontSize: 10 }}
              />
            )}
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name.includes("率")) return [`${value.toFixed(1)}%`, name]
                return [value.toFixed(1), name]
              }}
            />
            <Legend fontSize={11} />
            <Line
              yAxisId="score"
              type="monotone"
              dataKey="patientSatisfaction"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={messages.dashboard.satisfaction}
              connectNulls
            />
            <Line
              yAxisId="score"
              type="monotone"
              dataKey="employeeSatisfaction"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={messages.dashboard.employeeSatisfaction}
              connectNulls
            />
            <Line
              yAxisId={hasRateData ? "rate" : "score"}
              type="monotone"
              dataKey="maintenanceRate"
              stroke="#ea580c"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={messages.dashboard.maintenanceRate}
              connectNulls
            />
            <Line
              yAxisId={hasRateData ? "rate" : "score"}
              type="monotone"
              dataKey="selfPayRate"
              stroke="#9333ea"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={messages.dashboard.selfPayRate}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
