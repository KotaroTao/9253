"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, ArrowRight, Rocket } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ActivationStatus {
  staffRegistered: boolean
  firstSurveyDone: boolean
  advisoryUnlocked: boolean
  actionCreated: boolean
  advisoryThreshold: number
  totalResponses: number
}

interface ChecklistItem {
  key: string
  label: string
  done: boolean
  href: string
  description: string
}

export function ActivationChecklist({ isAdmin }: { isAdmin: boolean }) {
  const [status, setStatus] = useState<ActivationStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch("/api/activation-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setStatus(data.data)
      })
      .catch(() => {})
  }, [])

  if (!status || dismissed) return null

  const items: ChecklistItem[] = [
    {
      key: "staff",
      label: "スタッフを登録する",
      done: status.staffRegistered,
      href: "/dashboard/staff",
      description: "スタッフ管理ページから追加",
    },
    {
      key: "test",
      label: "テストアンケートを試す",
      done: status.firstSurveyDone, // first survey implicitly means they've tested
      href: "/dashboard/test",
      description: "テストモードで画面を確認",
    },
    {
      key: "survey",
      label: "初回アンケートを実施する",
      done: status.firstSurveyDone,
      href: "/dashboard",
      description: "医院端末で患者アンケートを開始",
    },
    {
      key: "advisory",
      label: `AI分析を確認する（${status.totalResponses}/${status.advisoryThreshold}件）`,
      done: status.advisoryUnlocked,
      href: "/dashboard/advisory",
      description: `${status.advisoryThreshold}件達成で自動解放`,
    },
    ...(isAdmin
      ? [
          {
            key: "action",
            label: "改善アクションを1つ設定する",
            done: status.actionCreated,
            href: "/dashboard/actions",
            description: "低スコアの質問から改善施策を登録",
          },
        ]
      : []),
  ]

  const completedCount = items.filter((i) => i.done).length
  const allDone = completedCount === items.length

  // All items complete -> don't show
  if (allDone) return null

  const progressPercent = Math.round((completedCount / items.length) * 100)

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-white">
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-bold text-blue-900">利用開始チェックリスト</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium">
              {completedCount}/{items.length}
            </span>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              非表示
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
