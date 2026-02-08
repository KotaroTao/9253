import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

const clickSchema = z.object({
  responseId: z.string().uuid("無効なレスポンスIDです"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = clickSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("無効なリクエストです", 400)
    }

    await prisma.surveyResponse.update({
      where: { id: parsed.data.responseId },
      data: { reviewClicked: true },
    })

    return successResponse({ success: true })
  } catch {
    return errorResponse("記録に失敗しました", 500)
  }
}
