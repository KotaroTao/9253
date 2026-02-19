import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { z } from "zod"

const updateDeviceSchema = z.object({
  name: z.string().max(100).optional(),
  isAuthorized: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result
  if (!user.clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  try {
    const device = await prisma.authorizedDevice.findFirst({
      where: { id: params.id, clinicId: user.clinicId },
    })
    if (!device) {
      return errorResponse(messages.errors.notFound, 404)
    }

    const body = await request.json()
    const parsed = updateDeviceSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const updated = await prisma.authorizedDevice.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return successResponse(updated)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result
  if (!user.clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  try {
    const device = await prisma.authorizedDevice.findFirst({
      where: { id: params.id, clinicId: user.clinicId },
    })
    if (!device) {
      return errorResponse(messages.errors.notFound, 404)
    }

    await prisma.authorizedDevice.delete({ where: { id: params.id } })
    return successResponse({ success: true })
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
