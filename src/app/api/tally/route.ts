import { NextRequest } from "next/server"
import { tallySchema } from "@/lib/validations/staff-survey"
import { incrementTally, getTodayTallies } from "@/lib/queries/tallies"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import type { TallyType } from "@/lib/constants"

export async function GET(request: NextRequest) {
  const staffToken = request.nextUrl.searchParams.get("staffToken")
  if (!staffToken) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const staff = await prisma.staff.findFirst({
    where: { qrToken: staffToken, isActive: true },
  })

  if (!staff) {
    return errorResponse(messages.tally.staffNotFound, 404)
  }

  const tallies = await getTodayTallies(staff.id)
  return successResponse(tallies)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = tallySchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const { staffToken, type, delta } = parsed.data

    const staff = await prisma.staff.findFirst({
      where: { qrToken: staffToken, isActive: true },
    })

    if (!staff) {
      return errorResponse(messages.tally.staffNotFound, 404)
    }

    await incrementTally(staff.id, staff.clinicId, type as TallyType, delta)

    // Return updated tallies
    const tallies = await getTodayTallies(staff.id)
    return successResponse(tallies)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
