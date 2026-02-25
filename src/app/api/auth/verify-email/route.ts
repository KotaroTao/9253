import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"

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

  // トークン発行から24時間以内かチェック
  const tokenAge = Date.now() - new Date(user.updatedAt).getTime()
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  if (tokenAge > TWENTY_FOUR_HOURS) {
    return errorResponse(messages.auth.verifyEmailExpired, 400)
  }

  // メール認証完了
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
    },
  })

  return successResponse({ verified: true })
}
