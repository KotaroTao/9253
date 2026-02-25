import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/ip"
import { sendMail, generateVerificationToken, buildVerificationEmail } from "@/lib/email"
import { messages } from "@/lib/messages"

export async function POST(_request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const userId = authResult.user.id

  // レート制限（再送は1時間に3回まで）
  const ip = getClientIp()
  const { allowed } = checkRateLimit(`resend-verify:${ip}`)
  if (!allowed) {
    return errorResponse("再送回数の上限に達しました。しばらく時間をおいてお試しください", 429)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, name: true, clinic: { select: { name: true } } },
  })

  if (!user) {
    return errorResponse(messages.errors.notFound, 404)
  }

  if (user.emailVerified) {
    return successResponse({ alreadyVerified: true })
  }

  // 新しいトークン生成・保存
  const token = generateVerificationToken()
  await prisma.user.update({
    where: { id: userId },
    data: { verificationToken: token },
  })

  // 認証メール送信
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
  const verifyUrl = `${appUrl}/verify-email?token=${token}`
  const { subject, html } = buildVerificationEmail(verifyUrl, user.clinic?.name || user.name)
  await sendMail({ to: user.email, subject, html })

  return successResponse({ sent: true })
}
