import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createStaffSchema } from "@/lib/validations/staff"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.common.error, 400)
  }

  try {
    const body = await request.json()
    const parsed = createStaffSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.common.error, 400)
    }

    const staff = await prisma.staff.create({
      data: {
        clinicId,
        name: parsed.data.name,
        role: parsed.data.role,
      },
    })

    return successResponse(staff, 201)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
