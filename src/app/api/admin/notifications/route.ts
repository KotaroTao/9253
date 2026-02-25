import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

/** 通知一覧取得（cursorベースページネーション対応） */
export async function GET(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { searchParams } = request.nextUrl
  const cursor = searchParams.get("cursor") // 前回最後のnotification ID
  const limit = Math.min(
    Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    MAX_LIMIT
  )

  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit + 1, // 次ページ存在判定のため+1
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 } // cursor自身をスキップ
      : {}),
  })

  const hasMore = notifications.length > limit
  if (hasMore) notifications.pop()

  const unreadCount = await prisma.adminNotification.count({
    where: { isRead: false },
  })

  const nextCursor = hasMore ? notifications[notifications.length - 1]?.id : null

  return successResponse({ notifications, unreadCount, nextCursor })
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
