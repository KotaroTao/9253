import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

const clickSchema = z.object({
  responseId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = clickSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.common.error, 400)
    }

    // Only allow updating responses created within the last hour
    const oneHourAgo = new Date(Date.now() - 3600000)
    const response = await prisma.surveyResponse.findFirst({
      where: {
        id: parsed.data.responseId,
        createdAt: { gte: oneHourAgo },
        reviewClicked: false,
      },
    })

    if (!response) {
      return errorResponse(messages.common.error, 404)
    }

    await prisma.surveyResponse.update({
      where: { id: response.id },
      data: { reviewClicked: true },
    })

    return successResponse({ success: true })
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
