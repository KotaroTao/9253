import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/ip"
import { getTokenTimestamp } from "@/lib/email"
import { messages } from "@/lib/messages"
import { resetPasswordSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"

const ONE_HOUR = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  const ip = getClientIp()
  const { allowed } = checkRateLimit(`resetPassword:${ip}`, "forgotPassword")
  if (!allowed) {
    return errorResponse(messages.auth.forgotPasswordRateLimited, 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const { token, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { passwordResetToken: token },
    select: { id: true, isActive: true },
  })

  if (!user || !user.isActive) {
    return errorResponse(messages.auth.resetPasswordInvalid, 400)
  }

  // トークンに埋め込まれたタイムスタンプで1時間以内かチェック
  const issuedAt = getTokenTimestamp(token)
  if (!issuedAt || Date.now() - issuedAt > ONE_HOUR) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: null },
    })
    return errorResponse(messages.auth.resetPasswordExpired, 400)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
    },
  })

  return successResponse({ reset: true })
}
