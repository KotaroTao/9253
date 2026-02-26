"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, ArrowRight, Rocket } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"

interface ActivationStatus {
  staffRegistered: boolean
  firstSurveyDone: boolean
  advisoryUnlocked: boolean
  actionCreated: boolean
  advisoryThreshold: number
  totalResponses: number
}

const DISMISS_KEY = "mieru-activation-checklist-dismissed"

export function ActivationChecklist({ isAdmin }: { isAdmin: boolean }) {
  const [status, setStatus] = useState<ActivationStatus | null>(null)
  const [dismissed, setDismissed] = useState(true) // SSR safe: 初期非表示

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1")
    fetch("/api/activation-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.data && !data.data.error) setStatus(data.data)
      })
      .catch(() => {})
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, "1")
  }, [])

  if (!status || dismissed) return null

  const m = messages.activationChecklist

  const items = [
    {
      key: "staff",
      label: m.staffRegistered,
      done: status.staffRegistered,
      href: "/dashboard/staff",
      description: m.staffRegisteredDesc,
    },
    {
      key: "survey",
      label: m.firstSurveyDone,
      done: status.firstSurveyDone,
      href: "/dashboard/test",
      description: m.firstSurveyDoneDesc,
    },
    {
      key: "advisory",
      label: m.advisoryUnlocked
        .replace("{current}", String(status.totalResponses))
        .replace("{threshold}", String(status.advisoryThreshold)),
      done: status.advisoryUnlocked,
      href: "/dashboard/advisory",
      description: m.advisoryUnlockedDesc
        .replace("{threshold}", String(status.advisoryThreshold)),
    },
    ...(isAdmin
      ? [
          {
            key: "action",
            label: m.actionCreated,
            done: status.actionCreated,
            href: "/dashboard/actions",
            description: m.actionCreatedDesc,
          },
        ]
      : []),
  ]

  const completedCount = items.filter((i) => i.done).length

  // 全完了時は表示しない
  if (completedCount === items.length) return null

  const progressPercent = Math.round((completedCount / items.length) * 100)

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-white">
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-bold text-blue-900">{m.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium">
              {completedCount}/{items.length}
            </span>
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {m.dismiss}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100 mb-4">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.done ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                item.done
                  ? "text-muted-foreground"
                  : "hover:bg-blue-50 text-foreground"
              )}
              onClick={item.done ? (e) => e.preventDefault() : undefined}
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-blue-300" />
              )}
              <div className="flex-1 min-w-0">
                <span className={cn(item.done && "line-through")}>{item.label}</span>
                {!item.done && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
              {!item.done && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
