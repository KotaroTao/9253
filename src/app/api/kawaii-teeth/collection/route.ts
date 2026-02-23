import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"

/** GET /api/kawaii-teeth/collection — クリニックの獲得コレクション */
export async function GET() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  // 獲得済みキャラをグループ化して件数付きで取得
  const collections = await prisma.kawaiiTeethCollection.groupBy({
    by: ["kawaiiTeethId"],
    where: { clinicId },
    _count: { id: true },
    _min: { acquiredAt: true },
  })

  if (collections.length === 0) {
    return successResponse([])
  }

  // キャラ情報を取得（有効なもののみ）
  const characterIds = collections.map((c) => c.kawaiiTeethId)
  const characters = await prisma.kawaiiTeeth.findMany({
    where: { id: { in: characterIds }, isActive: true },
    select: { id: true, name: true, description: true, imageData: true },
  })

  const charMap = new Map(characters.map((c) => [c.id, c]))

  const result = collections
    .map((c) => {
      const char = charMap.get(c.kawaiiTeethId)
      if (!char) return null
      return {
        id: char.id,
        name: char.name,
        description: char.description,
        imageData: char.imageData,
        count: c._count.id,
        firstAcquiredAt: c._min.acquiredAt,
      }
    })
    .filter(Boolean)

  return successResponse(result)
}
