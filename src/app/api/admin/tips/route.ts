import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

const SETTING_KEY = "patientTips"

type TipItem = {
  category: string
  title: string
  content: string
}

type TipSettingValue = {
  tips: TipItem[]
  rotationMinutes: number
}

export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const setting = await prisma.platformSetting.findUnique({
    where: { key: SETTING_KEY },
  })

  if (!setting) {
    return successResponse({ tips: [], rotationMinutes: 1440 })
  }

  const value = setting.value as unknown as TipSettingValue
  return successResponse({
    tips: value.tips ?? [],
    rotationMinutes: value.rotationMinutes ?? 1440,
  })
}

export async function PUT(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const body = await request.json()
    const { tips, rotationMinutes } = body

    if (!Array.isArray(tips)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const interval = Math.max(1, Math.floor(Number(rotationMinutes) || 1440))

    const validatedTips: TipItem[] = tips
      .filter(
        (t: Record<string, unknown>) =>
          t &&
          typeof t.category === "string" &&
          typeof t.title === "string" &&
          typeof t.content === "string" &&
          t.category.trim() &&
          t.title.trim() &&
          t.content.trim()
      )
      .map((t: Record<string, string>) => ({
        category: t.category.trim().slice(0, 50),
        title: t.title.trim().slice(0, 100),
        content: t.content.trim().slice(0, 500),
      }))

    const value: TipSettingValue = {
      tips: validatedTips,
      rotationMinutes: interval,
    }

    await prisma.platformSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: value as unknown as Prisma.InputJsonValue },
      create: {
        key: SETTING_KEY,
        value: value as unknown as Prisma.InputJsonValue,
      },
    })

    return successResponse({ tips: validatedTips, rotationMinutes: interval })
  } catch {
    return errorResponse(messages.tipManager.saveFailed, 500)
  }
}
