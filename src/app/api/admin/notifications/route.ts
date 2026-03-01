import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { parseCursorParams, sliceWithHasMore } from "@/lib/pagination"

/** 通知一覧取得（cursorベースページネーション対応） */
export async function GET(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { cursor, limit } = parseCursorParams(request.nextUrl.searchParams)

  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
  })

  const { items, hasMore } = sliceWithHasMore(notifications, limit)

  const unreadCount = await prisma.adminNotification.count({
    where: { isRead: false },
  })

  const nextCursor = hasMore ? items[items.length - 1]?.id : null

  return successResponse({ notifications: items, unreadCount, nextCursor })
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
