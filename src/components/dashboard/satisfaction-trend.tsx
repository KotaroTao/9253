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
import type { SatisfactionTrend } from "@/types"

interface SatisfactionTrendChartProps {
  data: SatisfactionTrend[]
}

export function SatisfactionTrendChart({ data }: SatisfactionTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{messages.dashboard.satisfactionTrend}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {messages.common.noData}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{messages.dashboard.satisfactionTrend}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis
              domain={[1, 5]}
              fontSize={10}
              label={{ value: "スコア", angle: -90, position: "insideLeft", fontSize: 10 }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                return [value.toFixed(1), name]
              }}
            />
            <Legend fontSize={11} />
            <Line
              type="monotone"
              dataKey="patientSatisfaction"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={messages.dashboard.satisfaction}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="employeeSatisfaction"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 3 }}
              name={messages.dashboard.employeeSatisfaction}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
