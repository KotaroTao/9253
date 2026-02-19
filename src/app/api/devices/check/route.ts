import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function GET(request: NextRequest) {
  try {
    const uuid = request.nextUrl.searchParams.get("uuid")
    if (!uuid) {
      return successResponse({ isAuthorized: false })
    }

    const device = await prisma.authorizedDevice.findUnique({
      where: { deviceUuid: uuid },
      select: { isAuthorized: true },
    })

    return successResponse({ isAuthorized: device?.isAuthorized ?? false })
  } catch {
    return errorResponse("Internal error", 500)
  }
}
