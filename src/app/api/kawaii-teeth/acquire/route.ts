import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"

/** POST /api/kawaii-teeth/acquire — ランダムにキャラを1つ獲得 */
export async function POST() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  // 有効なキャラからランダムに1つ選択
  const allCharacters = await prisma.kawaiiTeeth.findMany({
    where: { isActive: true },
    select: { id: true, name: true, description: true, imageData: true },
  })

  if (allCharacters.length === 0) {
    return errorResponse("キャラクターが登録されていません", 404)
  }

  const randomIndex = Math.floor(Math.random() * allCharacters.length)
  const selected = allCharacters[randomIndex]

  // コレクションに追加
  await prisma.kawaiiTeethCollection.create({
    data: {
      clinicId,
      kawaiiTeethId: selected.id,
    },
  })

  // 獲得数を取得
  const count = await prisma.kawaiiTeethCollection.count({
    where: { clinicId, kawaiiTeethId: selected.id },
  })

  return successResponse({
    character: selected,
    count,
    isNew: count === 1,
  }, 201)
}
