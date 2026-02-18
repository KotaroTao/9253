import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { updateClinicSchema } from "@/lib/validations/clinic"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"

export async function PATCH(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  try {
    const body = await request.json()
    const { regularClosedDays, ...rest } = body
    const parsed = updateClinicSchema.safeParse(rest)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    // Merge settings fields (regularClosedDays, closedDates, etc.)
    const settingsPatch: Partial<ClinicSettings> = {}
    if (Array.isArray(regularClosedDays) && regularClosedDays.every((d: unknown) => typeof d === "number" && d >= 0 && d <= 6)) {
      settingsPatch.regularClosedDays = regularClosedDays
    }
    if (Object.keys(settingsPatch).length > 0) {
      const merged = await updateClinicSettings(clinicId, settingsPatch)
      updateData.settings = merged
    }

    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: updateData,
    })

    return successResponse(clinic)
  } catch {
    return errorResponse(messages.errors.settingsUpdateFailed, 500)
  }
}
