import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { sendMail, buildReminderEmail } from "@/lib/email"
import type { ClinicSettings } from "@/types"

const CRON_SECRET = process.env.CRON_SECRET

/**
 * 未利用リマインダーメール送信 (POST)
 *
 * Cloud Scheduler から日次で呼び出される想定。
 * 登録後にアンケート回答がゼロのクリニックに対して、
 * 3日後・7日後・14日後にリマインダーメールを送信する。
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
  const REMINDER_DAYS = [3, 7, 14]

  // 回答がゼロのクリニック（デモ・system_adminは除外）
  const clinicsWithNoResponses = await prisma.clinic.findMany({
    where: {
      surveyResponses: { none: {} },
    },
    select: {
      id: true,
      name: true,
      settings: true,
      createdAt: true,
      users: {
        where: { role: "clinic_admin", isActive: true },
        select: { email: true, emailVerified: true },
        take: 1,
      },
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
  let sentCount = 0

  for (const clinic of clinicsWithNoResponses) {
    const settings = (clinic.settings ?? {}) as ClinicSettings
    // デモ・特別プランは除外
    if (settings.plan === "demo") continue

    const admin = clinic.users[0]
    if (!admin?.email || !admin.emailVerified) continue

    const daysSinceCreation = Math.floor(
      (now.getTime() - new Date(clinic.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    // 送信対象日でなければスキップ
    if (!REMINDER_DAYS.includes(daysSinceCreation)) continue

    // 最終送信日を settings に記録して重複送信を防止
    const lastReminderDay = (settings as Record<string, unknown>).lastReminderDay as number | undefined
    if (lastReminderDay === daysSinceCreation) continue

    const loginUrl = `${appUrl}/login`
    const { subject, html } = buildReminderEmail(clinic.name, loginUrl, daysSinceCreation)
    const sent = await sendMail({ to: admin.email, subject, html })

    if (sent) {
      sentCount++
      // 送信日を記録
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          settings: {
            ...settings,
            lastReminderDay: daysSinceCreation,
          },
        },
      })
    }
  }

  return successResponse({ sent: sentCount })
}
