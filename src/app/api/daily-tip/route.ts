import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"

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

  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const dailyTip = settings.dailyTip

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

    // body.dailyTip が null の場合はリセット（デフォルトに戻す）
    if (body.dailyTip === null) {
      await updateClinicSettings(clinicId, { dailyTip: undefined })
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

    await updateClinicSettings(clinicId, { dailyTip })
    return successResponse({ dailyTip })
  } catch {
    return errorResponse(messages.dailyTip.saveFailed, 500)
  }
}
