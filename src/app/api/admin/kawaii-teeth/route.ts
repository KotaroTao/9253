import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

/** GET /api/admin/kawaii-teeth — 全キャラ一覧 */
export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const characters = await prisma.kawaiiTeeth.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      imageData: true,
      isActive: true,
      createdAt: true,
      _count: { select: { collections: true } },
    },
  })

  return successResponse(characters)
}

const MAX_IMAGE_SIZE = 3_000_000 // ~3MB base64 (≈2MB binary)

/** POST /api/admin/kawaii-teeth — キャラ新規作成 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  let body: { name?: string; description?: string; imageData?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse("リクエストが不正です", 400)
  }

  const { name, description, imageData } = body

  if (!name?.trim()) {
    return errorResponse("キャラ名を入力してください", 400)
  }
  if (!description?.trim()) {
    return errorResponse("説明を入力してください", 400)
  }
  if (!imageData || !imageData.startsWith("data:image/")) {
    return errorResponse("画像をアップロードしてください", 400)
  }
  if (imageData.length > MAX_IMAGE_SIZE) {
    return errorResponse("画像サイズが大きすぎます（2MB以下）", 400)
  }

  const character = await prisma.kawaiiTeeth.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      imageData,
    },
  })

  return successResponse(character, 201)
}
