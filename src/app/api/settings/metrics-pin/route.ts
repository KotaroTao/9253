import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"
import bcrypt from "bcryptjs"

const PIN_RE = /^\d{4}$/

/** POST — PIN検証（経営レポート閲覧時） */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  let body: { pin?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const { pin } = body
  if (!pin || !PIN_RE.test(pin)) {
    return errorResponse(messages.metricsPin.pinInvalid, 400)
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings

  if (!settings.metricsPin) {
    // PINが未設定ならロック不要（アクセス許可）
    return successResponse({ valid: true })
  }

  const valid = await bcrypt.compare(pin, settings.metricsPin)
  if (!valid) {
    return errorResponse(messages.metricsPin.wrongPin, 403)
  }

  return successResponse({ valid: true })
}

/** PATCH — PIN設定・変更・削除 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  let body: { currentPin?: string; newPin?: string; action: "set" | "change" | "remove" }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const hasPin = !!settings.metricsPin

  if (body.action === "set") {
    // 初回設定: PIN未設定時のみ
    if (hasPin) {
      return errorResponse(messages.metricsPin.currentPinWrong, 400)
    }
    if (!body.newPin || !PIN_RE.test(body.newPin)) {
      return errorResponse(messages.metricsPin.pinInvalid, 400)
    }
    const hash = await bcrypt.hash(body.newPin, 10)
    await updateClinicSettings(clinicId, { metricsPin: hash })
    return successResponse({ message: messages.metricsPin.pinSet })
  }

  if (body.action === "change") {
    // 変更: 現在のPINが必要
    if (!hasPin) {
      return errorResponse(messages.metricsPin.pinInvalid, 400)
    }
    if (!body.currentPin || !PIN_RE.test(body.currentPin)) {
      return errorResponse(messages.metricsPin.pinInvalid, 400)
    }
    const valid = await bcrypt.compare(body.currentPin, settings.metricsPin!)
    if (!valid) {
      return errorResponse(messages.metricsPin.currentPinWrong, 403)
    }
    if (!body.newPin || !PIN_RE.test(body.newPin)) {
      return errorResponse(messages.metricsPin.pinInvalid, 400)
    }
    const hash = await bcrypt.hash(body.newPin, 10)
    await updateClinicSettings(clinicId, { metricsPin: hash })
    return successResponse({ message: messages.metricsPin.pinChanged })
  }

  if (body.action === "remove") {
    // 解除: 現在のPINが必要
    if (!hasPin) {
      return successResponse({ message: messages.metricsPin.pinRemoved })
    }
    if (!body.currentPin || !PIN_RE.test(body.currentPin)) {
      return errorResponse(messages.metricsPin.pinInvalid, 400)
    }
    const valid = await bcrypt.compare(body.currentPin, settings.metricsPin!)
    if (!valid) {
      return errorResponse(messages.metricsPin.currentPinWrong, 403)
    }
    await updateClinicSettings(clinicId, { metricsPin: undefined })
    return successResponse({ message: messages.metricsPin.pinRemoved })
  }

  return errorResponse(messages.errors.invalidInput, 400)
}
