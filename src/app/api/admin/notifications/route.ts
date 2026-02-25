import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

/** 通知一覧取得 */
export async function GET(_request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unreadCount = await prisma.adminNotification.count({
    where: { isRead: false },
  })

  return successResponse({ notifications, unreadCount })
}

/** すべて既読にする */
export async function PATCH(_request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  await prisma.adminNotification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  })

  return successResponse({ success: true })
}
