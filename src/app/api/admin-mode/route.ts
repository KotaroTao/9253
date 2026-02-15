import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { setAdminModeCookie, clearAdminModeCookie } from "@/lib/admin-mode"
import { messages } from "@/lib/messages"
import { DEFAULT_ADMIN_PASSWORD } from "@/lib/constants"
import type { ClinicSettings } from "@/types"

async function getClinicPassword(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  return settings.adminPassword
}

async function verifyPassword(password: string, hashedPassword: string | undefined): Promise<boolean> {
  if (!hashedPassword) {
    return password === DEFAULT_ADMIN_PASSWORD
  }
  return bcrypt.compare(password, hashedPassword)
}

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

  const hashedPassword = await getClinicPassword(clinicId)
  const isValid = await verifyPassword(password, hashedPassword)

  if (!isValid) {
    return errorResponse(messages.adminMode.wrongPassword, 401)
  }

  setAdminModeCookie()
  return successResponse({ success: true })
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword || typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  if (newPassword.length < 4) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const hashedPassword = await getClinicPassword(clinicId)
  const isValid = await verifyPassword(currentPassword, hashedPassword)

  if (!isValid) {
    return errorResponse(messages.adminMode.wrongPassword, 401)
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 10)
  const existingClinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const existingSettings = (existingClinic?.settings ?? {}) as ClinicSettings

  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      settings: { ...existingSettings, adminPassword: newHashedPassword },
    },
  })

  // パスワード変更後はセッションを無効化（再認証を要求）
  clearAdminModeCookie()

  return successResponse({ success: true })
}

export async function DELETE() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  clearAdminModeCookie()
  return successResponse({ success: true })
}
