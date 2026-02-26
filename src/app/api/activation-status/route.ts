import { successResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import type { ClinicSettings } from "@/types"

export async function GET() {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const clinicId = result.user.clinicId
  if (!clinicId) return successResponse({ error: true })

  const [staffCount, responseCount, advisoryCount, actionCount, clinic] = await Promise.all([
    prisma.staff.count({ where: { clinicId, isActive: true } }),
    prisma.surveyResponse.count({ where: { clinicId } }),
    prisma.advisoryReport.count({ where: { clinicId } }),
    prisma.improvementAction.count({ where: { clinicId } }),
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    }),
  ])

  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const threshold = settings.advisoryThreshold ?? 30

  return successResponse({
    staffRegistered: staffCount > 0,
    firstSurveyDone: responseCount > 0,
    advisoryUnlocked: responseCount >= threshold && advisoryCount > 0,
    actionCreated: actionCount > 0,
    advisoryThreshold: threshold,
    totalResponses: responseCount,
  })
}
