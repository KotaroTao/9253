"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { STREAK_MILESTONES, RANKS, KAWAII_TEETH_THRESHOLD } from "@/lib/constants"
import {
  Trophy, CalendarOff, Smartphone, ArrowRight, Sparkles,
  Target, TrendingUp, TrendingDown, MessageCircle, HelpCircle,
  ChevronLeft, ChevronRight, AlertTriangle, Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Confetti } from "@/components/survey/confetti"
import { cn } from "@/lib/utils"
import { KawaiiTeethCollection } from "@/components/dashboard/kawaii-teeth-collection"
import type { EngagementData } from "@/lib/queries/engagement"

interface ActiveAction {
  id: string
  title: string
  description: string | null
  targetQuestion: string | null
  targetQuestionId: string | null
  baselineScore: number | null
  resultScore: number | null
  status: string
  startedAt: string | Date
}

interface StaffEngagementProps {
  data: EngagementData
  kioskUrl: string
  isAdmin: boolean
  activeActions?: ActiveAction[]
  questionScores?: Record<string, number>
  staffCount?: number
}

export function StaffEngagement({
  data,
  kioskUrl,
  isAdmin,
  activeActions = [],
  questionScores = {},
  staffCount,
}: StaffEngagementProps) {
  const {
    todayCount,
    streak,
    totalCount,
    nextMilestone,
    weekDays,
    patientComments,
    improvementComments,
    rank,
    nextRank,
    rankProgress,
    dailyGoal,
  } = data

  const router = useRouter()
  const [togglingDate, setTogglingDate] = useState<string | null>(null)
  const [showRankInfo, setShowRankInfo] = useState(false)
  const [commentIndex, setCommentIndex] = useState(0)
  const [autoPaused, setAutoPaused] = useState(false)
  const [activeBadge, setActiveBadge] = useState<string | null>(null)

  const commentCount = patientComments.length
  const goNext = useCallback(() => {
    if (commentCount > 1) setCommentIndex((i) => (i + 1) % commentCount)
  }, [commentCount])
  const goPrev = useCallback(() => {
    if (commentCount > 1) setCommentIndex((i) => (i - 1 + commentCount) % commentCount)
  }, [commentCount])

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (commentCount <= 1 || autoPaused) return
    const timer = setInterval(goNext, 6000)
    return () => clearInterval(timer)
  }, [commentCount, autoPaused, goNext])

  const weekTotal = weekDays.reduce((sum, d) => sum + d.count, 0)

  // 獲得済みバッジ
  const earnedStreakBadges = STREAK_MILESTONES.filter((m) => streak >= m.days)


  async function handleToggleClosed(date: string, currentlyClosed: boolean) {
    setTogglingDate(date)
    try {
      const res = await fetch("/api/closed-dates", {
        method: currentlyClosed ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      })
      if (!res.ok) {
        console.error("[closed-dates] API error:", res.status)
        return
      }
      router.refresh()
    } finally {
      setTogglingDate(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Confetti when daily goal achieved */}
      {(todayCount >= dailyGoal && dailyGoal > 0) && <Confetti />}

      {/* スタッフ未登録アラート（管理者のみ） */}
      {isAdmin && staffCount === 0 && (
        <Link
          href="/dashboard/staff"
          className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50/60 to-white p-4 transition-all hover:border-amber-400 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-500">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">{messages.staff.noStaffAlert}</p>
            <p className="mt-0.5 text-xs text-amber-600/70">{messages.staff.noStaffAlertDesc}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-400" />
        </Link>
      )}

      {/* ⓪ Survey CTA button + flow image */}
      <a
        href={kioskUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white px-4 pt-4 pb-3 transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-blue-900 leading-snug">{messages.dashboard.startKiosk}</p>
            <p className="mt-0.5 text-[11px] text-blue-600/70">{messages.dashboard.startKioskDesc}</p>
          </div>
        </div>
        <div className="mt-2 -mx-1">
          <Image
            src="/mieru_tejun2.jpg"
            alt="アンケート実施手順：1.受付→2.質問設定→3.患者に渡す→4.回答→5.自動集計"
            width={680}
            height={400}
            className="w-full rounded-lg object-contain"
          />
        </div>
        <div className="mt-2 rounded-lg bg-blue-50/80 px-3 py-2">
          <p className="text-[11px] font-medium text-blue-800 mb-1">📋 かんたん手順</p>
          <ol className="text-[11px] leading-relaxed text-blue-700/80 space-y-0.5 list-none pl-0">
            <li>① タップしてアンケート画面を開く</li>
            <li>② 担当スタッフ、患者属性（初診/再診など）を選択</li>
            <li>③ 患者様にタブレットを渡す</li>
            <li>④ 30秒〜1分で簡単アンケート</li>
            <li>⑤ アンケート結果を自動分析</li>
          </ol>
          <p className="text-[11px] font-medium text-blue-800 mt-2 mb-1">💬 声かけ例</p>
          <p className="text-[11px] leading-relaxed text-blue-700/80">
            「お待ち間に、30秒ほどのアンケートにご協力お願いします」
          </p>
        </div>
      </a>

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

      {/* 統合ステータスカード（ランク・目標・チャート・コレクション） */}
      {totalCount > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-white">
          <CardContent className="py-5 space-y-4">
            {/* 本日のアンケート目標 */}
            <div>
              <p className={cn(
                "text-xs font-medium mb-1",
                todayCount >= dailyGoal && dailyGoal > 0 ? "text-green-600" : "text-muted-foreground"
              )}>
                {todayCount >= dailyGoal && dailyGoal > 0 ? messages.dashboard.dailyGoalAchieved : "本日のアンケート目標"}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold">
                  <span className={cn(todayCount >= dailyGoal && dailyGoal > 0 && "text-green-600")}>{todayCount}</span>
                  <span className="text-sm text-muted-foreground">/{dailyGoal}{messages.common.countSuffix}</span>
                </p>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      todayCount >= dailyGoal && dailyGoal > 0 ? "bg-green-500" : "bg-purple-400"
                    )}
                    style={{ width: `${Math.min(100, dailyGoal > 0 ? Math.round((todayCount / dailyGoal) * 100) : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Goal encouragement */}
            {dailyGoal > 0 && todayCount < dailyGoal && todayCount > 0 && dailyGoal - todayCount <= 3 && (
              <p className="text-xs text-center text-green-600 font-medium">
                {messages.dashboard.dailyGoalAlmost.replace("{remaining}", String(dailyGoal - todayCount))}
              </p>
            )}

            {/* 曜日別バーチャート */}
            {(() => {
              const maxCount = Math.max(...weekDays.map((d) => d.count), dailyGoal, 1)
              const goalLineBottom = (dailyGoal / maxCount) * 80
              return (
                <div className="relative">
                  {/* Goal dashed line */}
                  {dailyGoal > 0 && (
                    <>
                      <div
                        className="absolute left-0 right-0 border-t border-dashed border-green-400/60 pointer-events-none z-10"
                        style={{ bottom: `${goalLineBottom + 28 + 10 + 4}px` }}
                      />
                      <span
                        className="absolute right-0 text-[9px] text-green-500/70 font-medium pointer-events-none z-10"
                        style={{ bottom: `${goalLineBottom + 28 + 10 + 6}px` }}
                      >
                        {messages.dashboard.dailyGoalLine}{dailyGoal}
                      </span>
                    </>
                  )}
                  <div className="flex items-end gap-1.5">
                    {weekDays.map((day) => {
                      const barHeight = maxCount > 0 ? Math.max((day.count / maxCount) * 80, day.count > 0 ? 8 : 0) : 0
                      const isToggling = togglingDate === day.date

                      return (
                        <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                          {/* Count label */}
                          <span className={cn(
                            "text-[10px] font-medium",
                            day.isToday ? "text-purple-600" : day.isClosed ? "text-muted-foreground/40" : "text-muted-foreground"
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
                                    ? "bg-purple-400"
                                    : day.count > 0
                                      ? "bg-purple-200"
                                      : ""
                                )}
                                style={{ height: barHeight }}
                              />
                            )}
                          </div>

                          {/* Day label */}
                          <span className={cn(
                            "text-[10px]",
                            day.isToday ? "font-bold text-purple-600" : "text-muted-foreground"
                          )}>
                            {day.dayLabel}
                          </span>

                          {/* Bottom label */}
                          {day.isToday ? (
                            <button
                              onClick={() => handleToggleClosed(day.date, day.isClosed)}
                              disabled={isToggling}
                              className={cn(
                                "min-h-[28px] min-w-[36px] flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50",
                                day.isClosed
                                  ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                  : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                              )}
                              title={day.isClosed ? "診療日に切り替える" : "休診日にする"}
                            >
                              本日
                            </button>
                          ) : (
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
                </div>
              )
            })()}

            {/* Kawaii Teeth コレクション + ランク情報 */}
            <div className="border-t pt-3">
              <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
                {/* Kawaii Teeth */}
                <div className="flex-1 min-w-0">
                  <KawaiiTeethCollection embedded />
                </div>

                {/* ランク・次のランク・総アンケート数 */}
                <div className="mt-3 lg:mt-0 lg:shrink-0 lg:w-48 space-y-2 rounded-lg bg-purple-50/50 p-3">
                  <div className="relative flex items-center gap-1.5">
                    <span className="text-lg">{rank.emoji}</span>
                    <span className="text-sm font-bold">{rank.name}</span>
                    <button
                      onClick={() => setShowRankInfo((v) => !v)}
                      className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      aria-label="ランクシステムについて"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                    {showRankInfo && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowRankInfo(false)} />
                        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border bg-white p-3 shadow-lg">
                          <p className="text-xs font-bold text-foreground mb-2">ランクシステム</p>
                          <div className="space-y-1">
                            {RANKS.map((r) => (
                              <div
                                key={r.name}
                                className={cn(
                                  "flex items-center justify-between rounded-md px-2 py-1 text-xs",
                                  r.name === rank.name ? "bg-blue-50 font-bold text-blue-700" : "text-muted-foreground"
                                )}
                              >
                                <span>{r.emoji} {r.name}</span>
                                <span className="tabular-nums">{r.minCount.toLocaleString()}件〜</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {nextRank && (
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>次: {nextRank.name} {nextRank.emoji}</span>
                        <span>あと{(nextRank.minCount - totalCount).toLocaleString()}{messages.common.countSuffix}</span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-blue-400 transition-all"
                          style={{ width: `${rankProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    総アンケート数: <span className="font-bold text-foreground">{totalCount.toLocaleString()}</span>{messages.common.countSuffix}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* ④ 患者さまの声（カルーセル） */}
      {patientComments.length > 0 && (() => {
        const current = patientComments[commentIndex]
        if (!current) return null
        const commentDate = new Date(current.respondedAt).toLocaleDateString("ja-JP", {
          month: "short",
          day: "numeric",
        })
        return (
          <Card
            className="border-amber-200 bg-gradient-to-r from-amber-50/50 to-white"
            onMouseEnter={() => setAutoPaused(true)}
            onMouseLeave={() => setAutoPaused(false)}
          >
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <MessageCircle className="h-4 w-4" />
                  <p className="text-sm font-bold">{messages.dashboard.patientVoice}</p>
                </div>
                {commentCount > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={goPrev}
                      className="rounded-full p-0.5 text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
                      aria-label="前のコメント"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[10px] text-amber-500 tabular-nums min-w-[2rem] text-center">
                      {commentIndex + 1}/{commentCount}
                    </span>
                    <button
                      onClick={goNext}
                      className="rounded-full p-0.5 text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
                      aria-label="次のコメント"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground/80 italic pl-3 border-l-2 border-amber-200">
                「{current.text}」
              </blockquote>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{commentDate}</span>
                <span className="text-xs text-amber-600 font-medium">
                  {"⭐".repeat(Math.round(current.score))} {current.score.toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* ④-b 改善のヒント（管理者のみ） */}
      {isAdmin && improvementComments.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50/30 to-white">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-orange-600 mb-3">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-bold">改善のヒント（管理者のみ表示）</p>
            </div>
            <div className="space-y-2">
              {improvementComments.map((c, i) => {
                const d = new Date(c.respondedAt).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })
                return (
                  <div key={i} className="rounded-md bg-orange-50/50 px-3 py-2">
                    <p className="text-xs leading-relaxed text-foreground/70">
                      「{c.text}」
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{d}</span>
                      <span className="text-[10px] text-orange-500 font-medium">
                        {c.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ⑤ Active improvement actions */}
      {activeActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            現在取り組んでいる改善アクション
          </h2>
          {activeActions.map((action) => {
            const currentScore = action.targetQuestionId
              ? questionScores[action.targetQuestionId] ?? null
              : null
            const scoreChange =
              currentScore != null && action.baselineScore != null
                ? Math.round((currentScore - action.baselineScore) * 10) / 10
                : null

            return (
              <Card
                key={action.id}
                className="border-blue-200 bg-gradient-to-r from-blue-50/30 to-white"
              >
                <CardContent className="py-4">
                  <div className="flex w-full items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 shrink-0 text-blue-500" />
                        <p className="text-sm font-medium truncate">{action.title}</p>
                      </div>
                      {action.description && (
                        <p className="mt-1 text-xs text-muted-foreground pl-6">
                          {action.description}
                        </p>
                      )}
                      {action.targetQuestion && (
                        <p className="mt-0.5 text-xs text-muted-foreground/70 pl-6">
                          対象: {action.targetQuestion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {scoreChange !== null && (
                        <div
                          className={cn(
                            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                            scoreChange > 0
                              ? "bg-green-100 text-green-700"
                              : scoreChange < 0
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {scoreChange > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : scoreChange < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          {scoreChange > 0 ? "+" : ""}
                          {scoreChange}
                        </div>
                      )}
                      {action.baselineScore != null && (
                        <span className="text-xs text-muted-foreground">
                          {action.baselineScore}
                          {currentScore != null ? ` → ${currentScore}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          <Link
            href="/dashboard/actions"
            className="flex items-center justify-center gap-1 rounded-lg border border-dashed py-2.5 text-sm text-muted-foreground transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            改善アクションを管理
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Kawaii Teeth 獲得クエスト */}
      {totalCount > 0 && (() => {
        const teethCurrent = totalCount % KAWAII_TEETH_THRESHOLD
        const teethPercentage = Math.min(100, Math.round((teethCurrent / KAWAII_TEETH_THRESHOLD) * 100))
        const teethRemaining = KAWAII_TEETH_THRESHOLD - teethCurrent
        return (
          <Card className="border-pink-200 bg-gradient-to-r from-pink-50/50 to-white">
            <CardContent className="py-5">
              <div className="flex items-center gap-2">
                <span className="text-base">🦷</span>
                <p className="text-sm font-bold text-pink-900">
                  次の Kawaii Teeth まで
                </p>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-3 overflow-hidden rounded-full bg-pink-100">
                  <div
                    className="h-full rounded-full bg-pink-400 transition-all duration-500"
                    style={{ width: `${teethPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-pink-700 tabular-nums whitespace-nowrap">
                  {teethCurrent}/{KAWAII_TEETH_THRESHOLD}
                </span>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                あとアンケート{teethRemaining}件で Kawaii Teeth を獲得！
              </p>
            </CardContent>
          </Card>
        )
      })()}

      {/* ⑥ マイルストーン + バッジ */}
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

            {/* Next milestone progress */}
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

            {/* Earned badges */}
            {earnedStreakBadges.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">獲得バッジ</p>
                <div className="flex flex-wrap gap-1.5">
                  {earnedStreakBadges.map((badge) => {
                    const badgeKey = `streak-${badge.days}`
                    const isActive = activeBadge === badgeKey
                    return (
                      <div key={badge.days} className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveBadge(isActive ? null : badgeKey)}
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                            isActive
                              ? "bg-orange-200 text-orange-800 ring-1 ring-orange-300"
                              : "bg-orange-100 text-orange-700 hover:bg-orange-150"
                          )}
                        >
                          {badge.emoji}{badge.label}
                        </button>
                        {isActive && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveBadge(null)} />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full z-50 mb-1.5 w-44 rounded-lg border bg-white p-2.5 shadow-lg">
                              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b bg-white" />
                              <p className="text-[10px] font-bold text-orange-700 mb-1">獲得条件</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                アンケート回答を<span className="font-bold text-orange-600">{badge.days}日連続</span>で記録する（休診日はスキップ）
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
