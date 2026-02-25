import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"

/** DELETE — system_adminによるPINリセット */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!clinic) {
    return errorResponse("クリニックが見つかりません", 404)
  }

  await updateClinicSettings(id, { metricsPin: undefined })
  return successResponse({ ok: true })
}
