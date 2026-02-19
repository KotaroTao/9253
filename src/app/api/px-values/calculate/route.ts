import type { Prisma } from "@prisma/client"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import { calculateAllPxValues } from "@/lib/services/px-value-engine"

export async function POST() {
  const result = await requireRole("system_admin")
  if (isAuthError(result)) return result

  try {
    const values = await calculateAllPxValues()

    // Cache results in PlatformSetting
    const jsonValue = values as unknown as Prisma.InputJsonValue
    await prisma.platformSetting.upsert({
      where: { key: "px_values_latest" },
      update: { value: jsonValue },
      create: {
        key: "px_values_latest",
        value: jsonValue,
      },
    })

    return successResponse({
      clinics: values,
      calculatedAt: new Date().toISOString(),
    })
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
