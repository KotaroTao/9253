import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  FileText,
} from "lucide-react"
import Link from "next/link"

interface InsightCardsProps {
  averageScore: number
  prevAverageScore: number | null
  totalResponses: number
  lowScoreQuestions: Array<{ questionId: string; text: string; avgScore: number }>
  showSummaryBanner: boolean
}

interface Insight {
  type: "success" | "warning" | "info"
  icon: React.ReactNode
  text: string
  action?: { label: string; href: string }
}

function generateInsights({
  averageScore,
  prevAverageScore,
  totalResponses,
  lowScoreQuestions,
  showSummaryBanner,
}: InsightCardsProps): Insight[] {
  const insights: Insight[] = []

  // Score trend
  if (prevAverageScore != null && averageScore > 0) {
    const delta = Math.round((averageScore - prevAverageScore) * 10) / 10
    if (delta > 0) {
      insights.push({
        type: "success",
        icon: <TrendingUp className="h-4 w-4" />,
        text: messages.dashboard.insightScoreUp.replace("{delta}", String(Math.abs(delta))),
      })
    } else if (delta < 0) {
      insights.push({
        type: "warning",
        icon: <TrendingDown className="h-4 w-4" />,
        text: messages.dashboard.insightScoreDown.replace("{delta}", String(Math.abs(delta))),
      })
    } else {
      insights.push({
        type: "info",
        icon: <Minus className="h-4 w-4" />,
        text: messages.dashboard.insightScoreStable,
      })
    }
  }

  // Low score questions (top 2)
  for (const q of lowScoreQuestions.slice(0, 2)) {
    insights.push({
      type: "warning",
      icon: <AlertTriangle className="h-4 w-4" />,
      text: messages.dashboard.insightLowQuestion
        .replace("{question}", q.text.length > 20 ? q.text.slice(0, 20) + "…" : q.text)
        .replace("{score}", String(q.avgScore)),
      action: { label: messages.improvementActions.fromInsight, href: `/dashboard/actions?question=${q.questionId}` },
    })
  }

  // High satisfaction
  if (averageScore >= 4.5 && totalResponses >= 10) {
    insights.push({
      type: "success",
      icon: <Lightbulb className="h-4 w-4" />,
      text: messages.dashboard.insightHighSatisfaction,
    })
  }

  // Missing monthly metrics
  if (showSummaryBanner) {
    insights.push({
      type: "info",
      icon: <BarChart3 className="h-4 w-4" />,
      text: messages.dashboard.insightMissingMetrics,
      action: { label: messages.monthlyMetrics.enterSummary, href: "/dashboard/metrics" },
    })
  }

  // Response pace
  if (totalResponses > 0) {
    insights.push({
      type: "info",
      icon: <FileText className="h-4 w-4" />,
      text: messages.dashboard.insightResponseRate.replace("{count}", String(totalResponses)),
    })
  }

  // No data
  if (insights.length === 0) {
    insights.push({
      type: "info",
      icon: <Lightbulb className="h-4 w-4" />,
      text: messages.dashboard.insightNoData,
    })
  }

  return insights
}

const TYPE_STYLES = {
  success: {
    border: "border-green-200",
    bg: "bg-green-50",
    icon: "text-green-600",
    text: "text-green-800",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    icon: "text-amber-600",
    text: "text-amber-800",
  },
  info: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    text: "text-blue-800",
  },
}

export function InsightCards(props: InsightCardsProps) {
  const insights = generateInsights(props)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          {messages.dashboard.insightTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const style = TYPE_STYLES[insight.type]
            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border ${style.border} ${style.bg} px-3 py-2.5`}
              >
                <div className={`mt-0.5 shrink-0 ${style.icon}`}>{insight.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${style.text}`}>{insight.text}</p>
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                    >
                      {insight.action.label} →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
