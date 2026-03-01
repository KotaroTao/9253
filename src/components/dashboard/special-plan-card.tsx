"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { messages } from "@/lib/messages"
import { cn } from "@/lib/utils"
import type { SpecialPlanProgress } from "@/types"
import { FileText, Lightbulb, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

interface SpecialPlanCardProps {
  progress: SpecialPlanProgress
}

export function SpecialPlanCard({ progress }: SpecialPlanCardProps) {
  const { status, monthlyResponses, monthlyActions, requiredResponses, requiredActions } = progress

  const responsesMet = monthlyResponses >= requiredResponses
  const actionsMet = monthlyActions >= requiredActions

  const statusConfig = {
    grace: {
      badge: messages.plan.specialPlanGrace,
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Clock,
    },
    active: {
      badge: messages.plan.specialPlanActive,
      badgeClass: "bg-green-100 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    warning: {
      badge: messages.plan.specialPlanWarning,
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      icon: AlertTriangle,
    },
    suspended: {
      badge: messages.plan.specialPlanSuspended,
      badgeClass: "bg-red-100 text-red-700 border-red-200",
      icon: AlertTriangle,
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className={cn(
      "border",
      status === "warning" && "border-amber-300 bg-amber-50/30",
      status === "suspended" && "border-red-300 bg-red-50/30",
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <StatusIcon className="h-4 w-4" />
            {messages.plan.specialPlanConditions}
          </CardTitle>
          <Badge variant="outline" className={cn("text-[10px] font-normal", config.badgeClass)}>
            {status === "grace" ? "初月" : status === "active" ? "達成中" : status === "warning" ? "注意" : "停止中"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status message for warning/suspended */}
        {(status === "warning" || status === "suspended") && (
          <p className={cn(
            "text-xs",
            status === "warning" ? "text-amber-700" : "text-red-700"
          )}>
            {status === "warning" ? messages.plan.specialPlanWarning : messages.plan.specialPlanSuspended}
          </p>
        )}

        {/* Progress bars */}
        <div className="space-y-2">
          {/* Responses */}
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{messages.plan.specialPlanResponses}</span>
                <span className={cn("font-medium tabular-nums", responsesMet ? "text-green-600" : "text-foreground")}>
                  {monthlyResponses}/{requiredResponses}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    responsesMet ? "bg-green-500" : "bg-purple-400"
                  )}
                  style={{ width: `${Math.min(100, Math.round((monthlyResponses / requiredResponses) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{messages.plan.specialPlanActions}</span>
                <span className={cn("font-medium tabular-nums", actionsMet ? "text-green-600" : "text-foreground")}>
                  {monthlyActions}/{requiredActions}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    actionsMet ? "bg-green-500" : "bg-purple-400"
                  )}
                  style={{ width: `${Math.min(100, Math.round((monthlyActions / requiredActions) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
