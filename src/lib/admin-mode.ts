import { cookies } from "next/headers"
import { OPERATOR_CLINIC_COOKIE, OPERATOR_MODE_MAX_AGE } from "@/lib/constants"

/**
 * スタッフビュー切替Cookie。
 * clinic_admin / system_admin がスタッフビューに切り替える際に使用。
 */
const STAFF_VIEW_COOKIE = "mieru-staff-view"

export function isStaffViewOverride(): boolean {
  const cookieStore = cookies()
  return cookieStore.get(STAFF_VIEW_COOKIE)?.value === "1"
}

export function setStaffViewCookie() {
  const cookieStore = cookies()
  cookieStore.set(STAFF_VIEW_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })
}

export function clearStaffViewCookie() {
  const cookieStore = cookies()
  cookieStore.delete(STAFF_VIEW_COOKIE)
}

export function getOperatorClinicId(): string | null {
  const cookieStore = cookies()
  return cookieStore.get(OPERATOR_CLINIC_COOKIE)?.value ?? null
}

export function setOperatorClinicCookie(clinicId: string) {
  const cookieStore = cookies()
  cookieStore.set(OPERATOR_CLINIC_COOKIE, clinicId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OPERATOR_MODE_MAX_AGE,
    path: "/",
  })
}

export function clearOperatorClinicCookie() {
  const cookieStore = cookies()
  cookieStore.delete(OPERATOR_CLINIC_COOKIE)
}
