import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateClinicSchema } from "@/lib/validations/clinic"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

export async function PATCH(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  try {
    const body = await request.json()
    const parsed = updateClinicSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: parsed.data,
    })

    return successResponse(clinic)
  } catch {
    return errorResponse(messages.errors.settingsUpdateFailed, 500)
  }
}
