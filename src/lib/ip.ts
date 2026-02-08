import { headers } from "next/headers"
import crypto from "crypto"

export function getClientIp(): string {
  const headersList = headers()
  const xff = headersList.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const realIp = headersList.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "127.0.0.1"
}

export function hashIp(ip: string): string {
  const dailySalt = new Date().toISOString().split("T")[0] // YYYY-MM-DD
  return crypto.createHash("sha256").update(ip + dailySalt).digest("hex")
}
