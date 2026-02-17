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
    const { workingDaysPerWeek, ...rest } = body
    const parsed = updateClinicSchema.safeParse(rest)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    // Merge settings fields (workingDaysPerWeek, closedDates, etc.)
    if (typeof workingDaysPerWeek === "number" && [5, 6, 7].includes(workingDaysPerWeek)) {
      const patch: Partial<ClinicSettings> = { workingDaysPerWeek }
      const merged = await updateClinicSettings(clinicId, patch)
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
