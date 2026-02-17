import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { setAdminModeCookie, setOperatorClinicCookie, clearOperatorClinicCookie, clearAdminModeCookie } from "@/lib/admin-mode"
import { ROLES } from "@/lib/constants"

/**
 * GET: 運営モードでクリニックダッシュボードにログイン
 * ?clinicId=xxx → Cookieセット → /dashboard にリダイレクト
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== ROLES.SYSTEM_ADMIN) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const clinicId = request.nextUrl.searchParams.get("clinicId")
  if (!clinicId) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // クリニックの存在確認
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true },
  })
  if (!clinic) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // 運営モードCookieをセット
  setOperatorClinicCookie(clinicId)
  setAdminModeCookie()

  return NextResponse.redirect(new URL("/dashboard", request.url))
}

/**
 * DELETE: 運営モードを終了
 */
export async function DELETE() {
  clearOperatorClinicCookie()
  clearAdminModeCookie()

  return NextResponse.json({ ok: true })
}
