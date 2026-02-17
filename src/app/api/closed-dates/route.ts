import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"

/**
 * POST /api/closed-dates
 * ストリーク途切れ時に「休診日だった」と事後申告するAPI
 * Body: { date: "YYYY-MM-DD" }
 * Clinic.settings.closedDates に日付を追加
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  try {
    const body = await request.json()
    const { date } = body

    // Validate date format (YYYY-MM-DD) and actual calendar validity
    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }
    // Reject non-existent dates like "2024-02-30"
    const [y, m, d] = date.split("-").map(Number)
    const parsed = new Date(y, m - 1, d)
    if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    // Only allow dates within the last 14 days (prevent abuse)
    // Use string-based comparison to avoid timezone issues
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const fourteenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
    const fourteenDaysAgoStr = `${fourteenDaysAgo.getFullYear()}-${String(fourteenDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(fourteenDaysAgo.getDate()).padStart(2, "0")}`
    if (date > todayStr || date < fourteenDaysAgoStr) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    // Get existing closedDates via settings helper
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    })
    const settings = (clinic?.settings ?? {}) as ClinicSettings
    const closedDates = [...(settings.closedDates ?? [])]

    // Add date if not already present (max 365 entries to cover ~1 year)
    if (!closedDates.includes(date)) {
      closedDates.push(date)
      if (closedDates.length > 365) {
        closedDates.sort()
        closedDates.splice(0, closedDates.length - 365)
      }
    }

    await updateClinicSettings(clinicId, { closedDates })

    return successResponse({ success: true })
  } catch {
    return errorResponse(messages.errors.settingsUpdateFailed, 500)
  }
}

/**
 * DELETE /api/closed-dates
 * 休診日を解除する（営業日に戻す）
 * Body: { date: "YYYY-MM-DD" }
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  try {
    const body = await request.json()
    const { date } = body

    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    })
    const settings = (clinic?.settings ?? {}) as ClinicSettings
    const closedDates = (settings.closedDates ?? []).filter((d) => d !== date)

    await updateClinicSettings(clinicId, { closedDates })

    return successResponse({ success: true })
  } catch {
    return errorResponse(messages.errors.settingsUpdateFailed, 500)
  }
}
