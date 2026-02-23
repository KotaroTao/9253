import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

const MAX_IMAGE_SIZE = 3_000_000 // ~3MB base64 (≈2MB binary)

/** PATCH /api/admin/kawaii-teeth/[id] — キャラ更新 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  let body: { name?: string; description?: string; imageData?: string; isActive?: boolean }
  try {
    body = await request.json()
  } catch {
    return errorResponse("リクエストが不正です", 400)
  }

  const existing = await prisma.kawaiiTeeth.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse("キャラクターが見つかりません", 404)
  }

  const data: { name?: string; description?: string; imageData?: string; isActive?: boolean } = {}
  if (body.name?.trim()) data.name = body.name.trim()
  if (body.description?.trim()) data.description = body.description.trim()
  if (typeof body.isActive === "boolean") data.isActive = body.isActive
  if (body.imageData) {
    if (!body.imageData.startsWith("data:image/")) {
      return errorResponse("画像形式が不正です", 400)
    }
    if (body.imageData.length > MAX_IMAGE_SIZE) {
      return errorResponse("画像サイズが大きすぎます（2MB以下）", 400)
    }
    data.imageData = body.imageData
  }

  const updated = await prisma.kawaiiTeeth.update({
    where: { id },
    data,
  })

  return successResponse(updated)
}

/** DELETE /api/admin/kawaii-teeth/[id] — キャラ削除 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const existing = await prisma.kawaiiTeeth.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse("キャラクターが見つかりません", 404)
  }

  await prisma.kawaiiTeeth.delete({ where: { id } })

  return successResponse({ success: true })
}
