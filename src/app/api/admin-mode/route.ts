import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { setAdminModeCookie, clearAdminModeCookie } from "@/lib/admin-mode"
import { messages } from "@/lib/messages"

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const body = await request.json()
  const { password } = body

  if (!password || typeof password !== "string") {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })

  const settings = clinic?.settings as Record<string, unknown> | null
  const hashedPassword = settings?.adminPassword as string | undefined

  if (!hashedPassword) {
    return errorResponse(messages.adminMode.noPasswordSet, 400)
  }

  const isValid = await bcrypt.compare(password, hashedPassword)
  if (!isValid) {
    return errorResponse(messages.adminMode.wrongPassword, 401)
  }

  setAdminModeCookie()
  return successResponse({ success: true })
}

export async function DELETE() {
  clearAdminModeCookie()
  return successResponse({ success: true })
}
