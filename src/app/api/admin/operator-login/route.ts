import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { setOperatorClinicCookie, clearOperatorClinicCookie } from "@/lib/admin-mode"
import { ROLES } from "@/lib/constants"
import { errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * POST: 運営モードのCookieをセット
 * body: { clinicId: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== ROLES.SYSTEM_ADMIN) {
    return errorResponse(messages.errors.accessDenied, 403)
  }

  const body = await request.json().catch(() => null)
  const clinicId = body?.clinicId
  if (!clinicId || typeof clinicId !== "string") {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  // クリニックの存在確認
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true },
  })
  if (!clinic) {
    return errorResponse(messages.errors.invalidInput, 404)
  }

  // 運営モードCookieをセット
  setOperatorClinicCookie(clinicId)

  return NextResponse.json({ ok: true })
}

/**
 * DELETE: 運営モードを終了
 */
export async function DELETE() {
  clearOperatorClinicCookie()

  return NextResponse.json({ ok: true })
}
