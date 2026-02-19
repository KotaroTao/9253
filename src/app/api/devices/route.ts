import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { z } from "zod"

const createDeviceSchema = z.object({
  deviceUuid: z.string().uuid(),
  name: z.string().max(100).optional(),
})

export async function GET() {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result
  if (!user.clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  const devices = await prisma.authorizedDevice.findMany({
    where: { clinicId: user.clinicId },
    orderBy: { createdAt: "desc" },
  })

  return successResponse(devices)
}

export async function POST(request: NextRequest) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result
  if (!user.clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  try {
    const body = await request.json()
    const parsed = createDeviceSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const device = await prisma.authorizedDevice.create({
      data: {
        clinicId: user.clinicId,
        deviceUuid: parsed.data.deviceUuid,
        name: parsed.data.name,
      },
    })

    return successResponse(device, 201)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
