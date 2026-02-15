"use client"

import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Flame, MessageCircle, Trophy, Star, TrendingUp, ClipboardList } from "lucide-react"
import type { EngagementData } from "@/lib/queries/engagement"

interface StaffEngagementProps {
  data: EngagementData
}

// Rank color mapping
const RANK_STYLES: Record<string, { bg: string; text: string; border: string; progressBg: string; progressBar: string }> = {
  slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", progressBg: "bg-slate-100", progressBar: "bg-slate-400" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", progressBg: "bg-amber-100", progressBar: "bg-amber-500" },
  gray: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-300", progressBg: "bg-gray-100", progressBar: "bg-gray-400" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300", progressBg: "bg-yellow-100", progressBar: "bg-yellow-500" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", progressBg: "bg-cyan-100", progressBar: "bg-cyan-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", progressBg: "bg-blue-100", progressBar: "bg-blue-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", progressBg: "bg-purple-100", progressBar: "bg-purple-500" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", progressBg: "bg-rose-100", progressBar: "bg-rose-500" },
}

export function StaffEngagement({ data }: StaffEngagementProps) {
  const {
    todayCount,
    dailyGoal,
    streak,
    totalCount,
    nextMilestone,
    positiveComment,
    rank,
    nextRank,
    rankProgress,
    weekCount,
    weekAvgScore,
  } = data

  const progress = Math.min((todayCount / dailyGoal) * 100, 100)
  const goalReached = todayCount >= dailyGoal
  const remaining = dailyGoal - todayCount
  const style = RANK_STYLES[rank.color] ?? RANK_STYLES.slate

  return (
    <div className="space-y-4">
      {/* Rank badge + Week summary */}
      <div className="grid grid-cols-2 gap-3">
        {/* Rank card */}
        <Card className={`${style.border} ${style.bg}`}>
          <CardContent className="py-4 text-center">
            <div className="text-2xl">{rank.emoji}</div>
            <p className={`mt-1 text-sm font-bold ${style.text}`}>{rank.name}</p>
            {nextRank && (
              <>
                <div className={`mx-auto mt-2 h-1.5 w-full max-w-[80px] overflow-hidden rounded-full ${style.progressBg}`}>
                  <div
                    className={`h-full rounded-full ${style.progressBar} transition-all`}
                    style={{ width: `${rankProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {nextRank.emoji} {nextRank.name}まで
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Week summary card */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5" />
              <p className="text-xs font-medium">{messages.dashboard.weekSummary}</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{weekCount}<span className="text-sm font-normal text-muted-foreground">{messages.common.countSuffix}</span></p>
            {weekAvgScore && (
              <div className="mt-1 flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{weekAvgScore} / 5.0</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily goal + streak */}
      <Card className={goalReached ? "border-green-200 bg-gradient-to-r from-green-50/50 to-white" : undefined}>
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {messages.dashboard.dailyGoal}
            </p>
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-bold">
                    {messages.dashboard.streakPrefix}{streak}{messages.dashboard.streakDays}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{todayCount}</span>
            <span className="text-lg text-muted-foreground">/ {dailyGoal}{messages.common.countSuffix}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goalReached
                  ? "bg-green-500"
                  : progress > 50
                    ? "bg-blue-500"
                    : "bg-blue-400"
              }`}
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
        </CardContent>
      </Card>

      {/* Positive patient comment */}
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

      {/* Milestone / Total progress */}
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
              {totalCount.toLocaleString()}{messages.dashboard.milestoneVoicesDelivered}
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

      {/* Score trend indicator */}
      {weekAvgScore && weekAvgScore >= 4.0 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50/50 px-4 py-2.5">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <p className="text-xs text-green-700">
            {messages.dashboard.insightHighSatisfaction}
          </p>
        </div>
      )}
    </div>
  )
}
