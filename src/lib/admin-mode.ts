import { cookies } from "next/headers"
import { OPERATOR_CLINIC_COOKIE, OPERATOR_MODE_MAX_AGE } from "@/lib/constants"

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
