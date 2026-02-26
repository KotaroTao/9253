import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { getTokenTimestamp, sendMail, buildWelcomeEmail } from "@/lib/email"
import { messages } from "@/lib/messages"

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return errorResponse(messages.auth.verifyEmailInvalid, 400)
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  })

  if (!user) {
    return errorResponse(messages.auth.verifyEmailInvalid, 400)
  }

  // トークンに埋め込まれたタイムスタンプで24時間以内かチェック
  // タイムスタンプがない旧形式トークンは updatedAt にフォールバック
  const issuedAt = getTokenTimestamp(token) ?? new Date(user.updatedAt).getTime()
  const tokenAge = Date.now() - issuedAt
  if (tokenAge > TWENTY_FOUR_HOURS) {
    return errorResponse(messages.auth.verifyEmailExpired, 400)
  }

  // メール認証完了
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
    },
    include: { clinic: { select: { name: true } } },
  })

  // ウェルカムメール送信（非同期、失敗しても認証完了には影響しない）
  if (updatedUser.clinic?.name) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
    const loginUrl = `${appUrl}/login`
    const { subject, html } = buildWelcomeEmail(updatedUser.clinic.name, loginUrl)
    sendMail({ to: updatedUser.email, subject, html }).catch((err) => {
      console.error("[verify-email] Failed to send welcome email:", err)
    })
  }

  return successResponse({ verified: true })
}
