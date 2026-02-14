import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

export async function GET() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })

  const settings = (clinic?.settings as Record<string, unknown>) ?? {}
  const dailyTip = settings.dailyTip as { category: string; title: string; content: string } | undefined

  return successResponse({ dailyTip: dailyTip ?? null })
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  try {
    const body = await request.json()

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    })
    const existingSettings = (clinic?.settings as Record<string, unknown>) ?? {}

    // body.dailyTip が null の場合はリセット（デフォルトに戻す）
    if (body.dailyTip === null) {
      const { dailyTip: _, ...rest } = existingSettings
      await prisma.clinic.update({
        where: { id: clinicId },
        data: { settings: rest as Prisma.InputJsonValue },
      })
      return successResponse({ dailyTip: null })
    }

    const { category, title, content } = body.dailyTip ?? {}
    if (!category || !title || !content) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const dailyTip = {
      category: String(category).slice(0, 50),
      title: String(title).slice(0, 100),
      content: String(content).slice(0, 500),
    }

    await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        settings: { ...existingSettings, dailyTip } as Prisma.InputJsonValue,
      },
    })

    return successResponse({ dailyTip })
  } catch {
    return errorResponse(messages.dailyTip.saveFailed, 500)
  }
}
