import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { sendMail, buildWeeklySummaryEmail } from "@/lib/email"
import { jstToday, getDayJST } from "@/lib/date-jst"
import type { ClinicSettings } from "@/types"

const CRON_SECRET = process.env.CRON_SECRET
const DAY_MS = 24 * 60 * 60 * 1000

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

  // JST基準で今週月曜 00:00 を算出（Cloud Run UTCでも正しく動作）
  const today = jstToday()
  const dow = getDayJST(today) // 0=日, 1=月, ..., 6=土
  const isoDow = dow === 0 ? 7 : dow // ISO: 1=月〜7=日
  const thisMonday = new Date(today.getTime() - (isoDow - 1) * DAY_MS)
  const lastMonday = new Date(thisMonday.getTime() - 7 * DAY_MS)
  const twoWeeksAgo = new Date(lastMonday.getTime() - 7 * DAY_MS)

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
    if (settings.weeklyEmailDisabled) continue

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

    // 前週の回答があった日数（簡易版、JST基準）
    const activeDays = new Set(
      streakData.map((r) => {
        const jst = new Date(r.respondedAt.getTime() + 9 * 60 * 60 * 1000)
        return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-${String(jst.getUTCDate()).padStart(2, "0")}`
      })
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
