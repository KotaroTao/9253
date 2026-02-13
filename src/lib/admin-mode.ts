import { cookies } from "next/headers"
import { ADMIN_MODE_COOKIE, ADMIN_MODE_MAX_AGE } from "@/lib/constants"

export function isAdminMode(): boolean {
  const cookieStore = cookies()
  return cookieStore.get(ADMIN_MODE_COOKIE)?.value === "1"
}

export function setAdminModeCookie() {
  const cookieStore = cookies()
  cookieStore.set(ADMIN_MODE_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_MODE_MAX_AGE,
    path: "/",
  })
}

export function clearAdminModeCookie() {
  const cookieStore = cookies()
  cookieStore.delete(ADMIN_MODE_COOKIE)
}
