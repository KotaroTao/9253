import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { errorResponse, successResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { parseLoadMoreParams, sliceWithHasMore } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { clinicId } = result.user
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  const { offset, pageSize } = parseLoadMoreParams(request.nextUrl.searchParams)

  const responses = await prisma.surveyResponse.findMany({
    where: { clinicId },
    orderBy: { respondedAt: "desc" },
    skip: offset,
    take: pageSize + 1,
    select: {
      id: true,
      overallScore: true,
      freeText: true,
      patientAttributes: true,
      respondedAt: true,
      staff: { select: { name: true, role: true } },
    },
  })

  const { items, hasMore } = sliceWithHasMore(responses, pageSize)

  return successResponse({ items, hasMore })
}
