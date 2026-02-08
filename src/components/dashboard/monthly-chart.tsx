"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import type { MonthlyTrend } from "@/types"

interface MonthlyChartProps {
  data: MonthlyTrend[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{messages.dashboard.trend}</CardTitle>
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
        <CardTitle className="text-base">{messages.dashboard.trend}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis domain={[1, 5]} fontSize={12} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="hsl(221.2, 83.2%, 53.3%)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name={messages.dashboard.avgScore}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
