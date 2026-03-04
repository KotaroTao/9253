import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/ip"
import { logger } from "@/lib/logger"
import { sendMail, generateVerificationToken, buildPasswordResetEmail } from "@/lib/email"
import { messages } from "@/lib/messages"
import { forgotPasswordSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  const ip = getClientIp()
  const { allowed } = checkRateLimit(`forgotPassword:${ip}`, "forgotPassword")
  if (!allowed) {
    return errorResponse(messages.auth.forgotPasswordRateLimited, 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(messages.auth.emailRequired, 400)
  }

  const { email } = parsed.data

  // セキュリティ: ユーザーが存在しなくても同じレスポンスを返す（メール列挙攻撃防止）
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, isActive: true },
  })

  if (user && user.isActive) {
    const token = generateVerificationToken()
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
    const resetUrl = `${appUrl}/reset-password?token=${token}`
    const { subject, html } = buildPasswordResetEmail(resetUrl, user.name)

    const sent = await sendMail({ to: email, subject, html })
    if (!sent) {
      logger.error("Failed to send password reset email", { component: "forgot-password", email })
    }
  }

  // 常に成功レスポンスを返す（ユーザー存在の有無を漏らさない）
  return successResponse({ sent: true })
}
