import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Flame, MessageCircle, Trophy } from "lucide-react"
import type { EngagementData } from "@/lib/queries/engagement"

interface StaffEngagementProps {
  data: EngagementData
}

export function StaffEngagement({ data }: StaffEngagementProps) {
  const {
    todayCount,
    dailyGoal,
    streak,
    totalCount,
    currentMilestone,
    nextMilestone,
    positiveComment,
  } = data

  const progress = Math.min((todayCount / dailyGoal) * 100, 100)
  const goalReached = todayCount >= dailyGoal

  return (
    <div className="space-y-4">
      {/* Daily goal + streak */}
      <Card>
        <CardContent className="py-5">
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

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{todayCount}</span>
            <span className="text-lg text-muted-foreground">/ {dailyGoal}{messages.common.countSuffix}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                goalReached
                  ? "bg-green-500"
                  : progress > 50
                    ? "bg-blue-500"
                    : "bg-blue-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {goalReached && (
            <p className="mt-2 text-sm font-medium text-green-600">
              {messages.dashboard.goalReached}
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

      {/* Milestone */}
      {currentMilestone && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-2 text-purple-600">
              <Trophy className="h-4 w-4" />
              <p className="text-sm font-bold">
                {messages.dashboard.milestonePrefix}{currentMilestone.toLocaleString()}{messages.dashboard.milestoneSuffix}
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
                    className="h-full rounded-full bg-purple-400"
                    style={{
                      width: `${Math.round(((totalCount - (currentMilestone ?? 0)) / ((nextMilestone ?? totalCount) - (currentMilestone ?? 0))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
