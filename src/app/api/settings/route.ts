import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
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
    const { adminPassword, ...rest } = body
    const parsed = updateClinicSchema.safeParse(rest)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    if (adminPassword && typeof adminPassword === "string" && adminPassword.length >= 6) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      const existingClinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { settings: true },
      })
      const existingSettings = (existingClinic?.settings as Record<string, unknown>) ?? {}
      updateData.settings = { ...existingSettings, adminPassword: hashedPassword }
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
