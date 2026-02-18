import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"

const PAGE_SIZE = 10

export async function GET(request: NextRequest) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { clinicId } = result.user
  if (!clinicId) {
    return NextResponse.json({ error: "クリニックが見つかりません" }, { status: 400 })
  }

  const { searchParams } = request.nextUrl
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0"))

  const responses = await prisma.surveyResponse.findMany({
    where: { clinicId },
    orderBy: { respondedAt: "desc" },
    skip: offset,
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      overallScore: true,
      freeText: true,
      patientAttributes: true,
      respondedAt: true,
      staff: { select: { name: true, role: true } },
    },
  })

  const hasMore = responses.length > PAGE_SIZE
  const items = hasMore ? responses.slice(0, PAGE_SIZE) : responses

  return NextResponse.json({ items, hasMore })
}
