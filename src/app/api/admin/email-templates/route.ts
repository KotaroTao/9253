import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getEmailTemplates } from "@/lib/email"
import {
  SETTING_KEY,
  DEFAULT_VERIFICATION_TEMPLATE,
  DEFAULT_WELCOME_TEMPLATE,
  type EmailTemplatesSettingValue,
} from "@/lib/email-templates"

export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { verification, welcome, isCustom } = await getEmailTemplates()
  return successResponse({ verification, welcome, isCustom })
}

export async function PUT(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const body = await request.json()
    const { verification, welcome, resetToDefaults } = body

    if (resetToDefaults) {
      await prisma.platformSetting.deleteMany({
        where: { key: SETTING_KEY },
      })
      return successResponse({
        verification: DEFAULT_VERIFICATION_TEMPLATE,
        welcome: DEFAULT_WELCOME_TEMPLATE,
        isCustom: false,
      })
    }

    if (!verification || !welcome) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    // Validate required fields (body is optional for welcome template)
    if (!verification.subject?.trim() || !verification.greeting?.trim() || !verification.body?.trim()) {
      return errorResponse(messages.errors.invalidInput, 400)
    }
    if (!welcome.subject?.trim() || !welcome.greeting?.trim()) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const value: EmailTemplatesSettingValue = {
      verification: {
        subject: verification.subject.trim().slice(0, 200),
        greeting: verification.greeting.trim().slice(0, 500),
        body: verification.body.trim().slice(0, 2000),
        note: (verification.note ?? "").trim().slice(0, 500),
      },
      welcome: {
        subject: welcome.subject.trim().slice(0, 200),
        greeting: welcome.greeting.trim().slice(0, 500),
        body: (welcome.body ?? "").trim().slice(0, 2000),
        note: (welcome.note ?? "").trim().slice(0, 500),
        steps: welcome.steps
          ? welcome.steps.map((s: { title: string; description: string }) => ({
              title: (s.title ?? "").trim().slice(0, 100),
              description: (s.description ?? "").trim().slice(0, 200),
            }))
          : undefined,
      },
    }

    await prisma.platformSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: value as unknown as Prisma.InputJsonValue },
      create: {
        key: SETTING_KEY,
        value: value as unknown as Prisma.InputJsonValue,
      },
    })

    return successResponse({
      verification: value.verification,
      welcome: value.welcome,
      isCustom: true,
    })
  } catch {
    return errorResponse(messages.emailTemplates.saveFailed, 500)
  }
}
