"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Flame, MessageCircle, Trophy, CalendarOff, Smartphone, ArrowRight, Sparkles } from "lucide-react"
import { Confetti } from "@/components/survey/confetti"
import { cn } from "@/lib/utils"
import type { EngagementData } from "@/lib/queries/engagement"

interface StaffEngagementProps {
  data: EngagementData
  kioskUrl: string
  activeActions?: Array<{
    id: string
    title: string
    description: string | null
    targetQuestion: string | null
  }>
}

export function StaffEngagement({ data, kioskUrl, activeActions = [] }: StaffEngagementProps) {
  const {
    todayCount,
    dailyGoal,
    streak,
    totalCount,
    nextMilestone,
    positiveComment,
    weekDays,
  } = data

  const router = useRouter()
  const [togglingDate, setTogglingDate] = useState<string | null>(null)

  const progress = Math.min((todayCount / dailyGoal) * 100, 100)
  const goalReached = todayCount >= dailyGoal
  const remaining = dailyGoal - todayCount
  const weekTotal = weekDays.reduce((sum, d) => sum + d.count, 0)

  async function handleToggleClosed(date: string, currentlyClosed: boolean) {
    setTogglingDate(date)
    try {
      if (currentlyClosed) {
        // Remove closed date
        await fetch("/api/closed-dates", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        })
      } else {
        // Add closed date
        await fetch("/api/closed-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        })
      }
      router.refresh()
    } finally {
      setTogglingDate(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Confetti when goal reached */}
      {goalReached && <Confetti />}

      {/* Onboarding for first-time users */}
      {totalCount === 0 && todayCount === 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-bold">{messages.dashboard.onboardingTitle}</p>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">1</span>
                {messages.dashboard.onboardingStep1}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">2</span>
                {messages.dashboard.onboardingStep2}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">3</span>
                {messages.dashboard.onboardingStep3}
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* ②③ Daily goal + Week chart combined */}
      <Card>
        <CardContent className="py-5">
          {/* Daily goal header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {messages.dashboard.dailyGoal}
            </p>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-bold">
                  {messages.dashboard.streakPrefix}{streak}{messages.dashboard.streakDays}
                </span>
              </div>
            )}
          </div>

          {/* Today's count */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{todayCount}</span>
            <span className="text-lg text-muted-foreground">/ {dailyGoal}{messages.common.countSuffix}</span>
            {goalReached && <span className="text-lg">🎉</span>}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                goalReached
                  ? "bg-green-500"
                  : progress > 50
                    ? "bg-blue-500"
                    : "bg-blue-400"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {goalReached ? (
            <p className="mt-2 text-sm font-medium text-green-600">
              {messages.dashboard.goalCelebration}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              {messages.dashboard.goalKeepGoing.replace("{remaining}", String(remaining))}
            </p>
          )}

          {/* Week chart separator */}
          <div className="mt-5 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">過去1週間</p>
              <p className="text-xs text-muted-foreground">
                合計 <span className="font-bold text-foreground">{weekTotal}</span>{messages.common.countSuffix}
              </p>
            </div>

            {/* Bar chart for each day */}
            {(() => {
              const maxCount = Math.max(...weekDays.map((d) => d.count), dailyGoal)
              const todayDate = weekDays.find((d) => d.isToday)?.date
              return (
                <div className="flex items-end gap-1.5">
                  {weekDays.map((day) => {
                    const barHeight = maxCount > 0 ? Math.max((day.count / maxCount) * 80, day.count > 0 ? 8 : 0) : 0
                    const isToggling = togglingDate === day.date
                    const isPast = !day.isToday && todayDate != null && day.date < todayDate

                    return (
                      <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                        {/* Count label */}
                        <span className={cn(
                          "text-[10px] font-medium",
                          day.isToday ? "text-blue-600" : day.isClosed ? "text-muted-foreground/40" : "text-muted-foreground"
                        )}>
                          {day.isClosed ? "-" : day.count}
                        </span>

                        {/* Bar */}
                        <div className="relative w-full" style={{ height: 80 }}>
                          {day.isClosed ? (
                            <div className="absolute bottom-0 w-full flex items-center justify-center" style={{ height: 80 }}>
                              <CalendarOff className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "absolute bottom-0 w-full rounded-t-sm transition-all",
                                day.isToday
                                  ? goalReached ? "bg-green-400" : "bg-blue-400"
                                  : day.count >= dailyGoal
                                    ? "bg-green-300"
                                    : day.count > 0
                                      ? "bg-blue-200"
                                      : ""
                              )}
                              style={{ height: barHeight }}
                            />
                          )}
                          {/* Goal line */}
                          {!day.isClosed && maxCount > 0 && (
                            <div
                              className="absolute w-full border-t border-dashed border-muted-foreground/20"
                              style={{ bottom: `${(dailyGoal / maxCount) * 80}px` }}
                            />
                          )}
                        </div>

                        {/* Day label */}
                        <span className={cn(
                          "text-[10px]",
                          day.isToday ? "font-bold text-blue-600" : "text-muted-foreground"
                        )}>
                          {day.dayLabel}
                        </span>

                        {/* Closed day toggle for past days */}
                        {isPast && (
                          <button
                            onClick={() => handleToggleClosed(day.date, day.isClosed)}
                            disabled={isToggling}
                            className={cn(
                              "min-h-[28px] min-w-[36px] rounded-full px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-50",
                              day.isClosed
                                ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                : "bg-muted text-muted-foreground/60 hover:bg-muted/80 hover:text-muted-foreground"
                            )}
                            title={day.isClosed ? "営業日に戻す" : "休診日にする"}
                          >
                            {day.isClosed ? "休診" : "休診?"}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </CardContent>
      </Card>

      {/* ④ Kiosk action card (large) */}
      <a
        href={kioskUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
          <Smartphone className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-blue-900">{messages.dashboard.startSurvey}</p>
          <p className="text-sm text-blue-600/70">{messages.dashboard.startSurveyDesc}</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" />
      </a>

      {/* ⑤ Patient voice */}
      {positiveComment && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-2 text-amber-600">
              <MessageCircle className="h-4 w-4" />
              <p className="text-sm font-medium">{messages.dashboard.patientVoice}</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed">
              「{positiveComment}」
            </p>
          </CardContent>
        </Card>
      )}

      {/* ⑥ Total milestone */}
      {totalCount > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-2 text-purple-600">
              <Trophy className="h-4 w-4" />
              <p className="text-sm font-bold">
                {messages.dashboard.milestonePrefix}{totalCount.toLocaleString()}{messages.dashboard.milestoneSuffix}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {messages.dashboard.milestoneVoicesDelivered.replace("{count}", totalCount.toLocaleString())}
            </p>
            {nextMilestone && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{messages.dashboard.nextMilestone}: {nextMilestone.toLocaleString()}{messages.common.countSuffix}</span>
                  <span>{messages.dashboard.milestoneRemaining}{(nextMilestone - totalCount).toLocaleString()}{messages.common.countSuffix}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-purple-400 transition-all"
                    style={{
                      width: `${Math.round(((totalCount - (data.currentMilestone ?? 0)) / ((nextMilestone ?? totalCount) - (data.currentMilestone ?? 0))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ⑦ Active improvement actions */}
      {activeActions.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              現在取り組んでいる改善アクション
            </p>
            <div className="space-y-2">
              {activeActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-lg border bg-blue-50/50 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-blue-900">{action.title}</p>
                  {action.description && (
                    <p className="mt-0.5 text-xs text-blue-600/70 line-clamp-2">{action.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
