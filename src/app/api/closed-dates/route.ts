import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

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

    // Validate date format (YYYY-MM-DD)
    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    // Only allow dates within the last 14 days (prevent abuse)
    const targetDate = new Date(date + "T00:00:00")
    const now = new Date()
    const fourteenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
    if (targetDate > now || targetDate < fourteenDaysAgo) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    // Get existing settings
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    })
    const settings = (clinic?.settings as Record<string, unknown>) ?? {}
    const closedDates = Array.isArray(settings.closedDates) ? (settings.closedDates as string[]) : []

    // Add date if not already present (max 90 entries to prevent bloat)
    if (!closedDates.includes(date)) {
      closedDates.push(date)
      // Keep only the most recent 90 entries
      if (closedDates.length > 90) {
        closedDates.sort()
        closedDates.splice(0, closedDates.length - 90)
      }
    }

    await prisma.clinic.update({
      where: { id: clinicId },
      data: { settings: { ...settings, closedDates } },
    })

    return successResponse({ success: true })
  } catch {
    return errorResponse(messages.errors.settingsUpdateFailed, 500)
  }
}
