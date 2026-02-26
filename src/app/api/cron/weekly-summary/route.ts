import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { sendMail, buildWeeklySummaryEmail } from "@/lib/email"
import type { ClinicSettings } from "@/types"

const CRON_SECRET = process.env.CRON_SECRET

/**
 * 週次サマリーメール送信 (POST)
 *
 * Cloud Scheduler から毎週月曜朝に呼び出される想定。
 * クリニック管理者に前週の回答数・平均スコア・ストリークを送信する。
 */
export async function POST(request: NextRequest) {
  // CRON_SECRET が設定されている場合は認証チェック
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return errorResponse("Unauthorized", 401)
    }
  }

  const now = new Date()
  // 前週: 月曜 00:00 〜 日曜 23:59
  const thisMonday = new Date(now)
  thisMonday.setHours(0, 0, 0, 0)
  thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7))

  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(lastMonday.getDate() - 7)

  const twoWeeksAgo = new Date(lastMonday)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7)

  // アクティブなクリニック一覧
  const clinics = await prisma.clinic.findMany({
    select: {
      id: true,
      name: true,
      settings: true,
      users: {
        where: { role: "clinic_admin", isActive: true, emailVerified: { not: null } },
        select: { email: true },
        take: 1,
      },
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
  let sentCount = 0

  for (const clinic of clinics) {
    const settings = (clinic.settings ?? {}) as ClinicSettings
    if (settings.plan === "demo") continue
    // メール配信停止設定
    if ((settings as Record<string, unknown>).weeklyEmailDisabled === true) continue

    const admin = clinic.users[0]
    if (!admin?.email) continue

    // 前週の統計
    const [weeklyAgg, prevWeekAgg, totalCount, streakData] = await Promise.all([
      prisma.surveyResponse.aggregate({
        where: {
          clinicId: clinic.id,
          respondedAt: { gte: lastMonday, lt: thisMonday },
        },
        _count: true,
        _avg: { overallScore: true },
      }),
      prisma.surveyResponse.aggregate({
        where: {
          clinicId: clinic.id,
          respondedAt: { gte: twoWeeksAgo, lt: lastMonday },
        },
        _count: true,
      }),
      prisma.surveyResponse.count({ where: { clinicId: clinic.id } }),
      // 簡易ストリーク計算（直近7日で回答のあった日数）
      prisma.surveyResponse.findMany({
        where: {
          clinicId: clinic.id,
          respondedAt: { gte: lastMonday, lt: thisMonday },
        },
        select: { respondedAt: true },
      }),
    ])

    // ストリーク: 前週で回答があった日数（簡易版）
    const activeDays = new Set(
      streakData.map((r) => r.respondedAt.toISOString().split("T")[0])
    ).size

    const loginUrl = `${appUrl}/login`
    const { subject, html } = buildWeeklySummaryEmail(clinic.name, loginUrl, {
      weeklyResponses: weeklyAgg._count,
      weeklyAvgScore: weeklyAgg._avg.overallScore,
      prevWeekResponses: prevWeekAgg._count,
      streak: activeDays,
      totalResponses: totalCount,
    })

    const sent = await sendMail({ to: admin.email, subject, html })
    if (sent) sentCount++
  }

  return successResponse({ sent: sentCount })
}
