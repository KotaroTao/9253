import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { DYNAMIC_MESSAGES, MESSAGE_CATEGORIES } from "@/lib/dynamic-messages"
import type { StoredComment } from "@/lib/dynamic-messages"

const SETTING_KEY = "dashboardComments"

type CommentsSettingValue = {
  comments: StoredComment[]
}

export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const setting = await prisma.platformSetting.findUnique({
    where: { key: SETTING_KEY },
  })

  if (!setting) {
    // Return defaults from hardcoded messages
    const defaults: StoredComment[] = DYNAMIC_MESSAGES.map((msg) => ({
      category: msg.category ?? "generic",
      text: msg.text,
    }))
    return successResponse({ comments: defaults, isCustom: false })
  }

  const value = setting.value as unknown as CommentsSettingValue
  return successResponse({
    comments: value.comments ?? [],
    isCustom: true,
  })
}

export async function PUT(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const body = await request.json()
    const { comments, resetToDefaults } = body

    // Reset to defaults: delete the platform setting
    if (resetToDefaults) {
      await prisma.platformSetting.deleteMany({
        where: { key: SETTING_KEY },
      })
      const defaults: StoredComment[] = DYNAMIC_MESSAGES.map((msg) => ({
        category: msg.category ?? "generic",
        text: msg.text,
      }))
      return successResponse({ comments: defaults, isCustom: false })
    }

    if (!Array.isArray(comments)) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const validCategories: string[] = MESSAGE_CATEGORIES.map((c) => c.key)

    const validatedComments: StoredComment[] = comments
      .filter(
        (c: Record<string, unknown>) =>
          c &&
          typeof c.category === "string" &&
          typeof c.text === "string" &&
          c.text.toString().trim() &&
          validCategories.includes(c.category as string)
      )
      .map((c: Record<string, string>) => ({
        category: c.category.trim(),
        text: c.text.trim().slice(0, 200),
      }))

    const value: CommentsSettingValue = {
      comments: validatedComments,
    }

    await prisma.platformSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: value as unknown as Prisma.InputJsonValue },
      create: {
        key: SETTING_KEY,
        value: value as unknown as Prisma.InputJsonValue,
      },
    })

    return successResponse({ comments: validatedComments, isCustom: true })
  } catch {
    return errorResponse(messages.commentsManager.saveFailed, 500)
  }
}
