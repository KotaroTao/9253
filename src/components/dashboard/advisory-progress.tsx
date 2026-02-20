"use client"

import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Brain, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { AdvisoryProgress } from "@/types"

interface AdvisoryProgressCardProps {
  progress: AdvisoryProgress
  isAdmin: boolean
}

export function AdvisoryProgressCard({ progress, isAdmin }: AdvisoryProgressCardProps) {
  const { current, threshold, percentage, lastReport } = progress

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-white">
      <CardContent className="py-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-purple-600" />
          <p className="text-sm font-bold text-purple-900">
            {messages.advisory.progressLabel}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-purple-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                percentage >= 100 ? "bg-purple-500" : "bg-purple-400"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm font-bold text-purple-700 tabular-nums whitespace-nowrap">
            {current}/{threshold}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          {percentage >= 100 ? (
            <p className="text-xs font-medium text-purple-600">
              {messages.advisory.progressReady}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {messages.advisory.progressRemaining.replace(
                "{remaining}",
                String(threshold - current)
              )}
            </p>
          )}
          {lastReport && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(lastReport.generatedAt).toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Admin link to full report */}
        {isAdmin && lastReport && (
          <Link
            href="/dashboard/advisory"
            className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-purple-200 py-2 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50"
          >
            {messages.advisory.viewReport}
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
