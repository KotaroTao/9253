import { successResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { KAWAII_TEETH_THRESHOLD } from "@/lib/constants"

export async function GET() {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const clinicId = result.user.clinicId
  if (!clinicId) return successResponse({ error: true })

  const [staffCount, responseCount, actionCount, teethCount] = await Promise.all([
    prisma.staff.count({ where: { clinicId, isActive: true } }),
    prisma.surveyResponse.count({ where: { clinicId } }),
    prisma.improvementAction.count({ where: { clinicId } }),
    prisma.kawaiiTeethCollection.count({ where: { clinicId } }),
  ])

  return successResponse({
    staffRegistered: staffCount > 0,
    firstSurveyDone: responseCount > 0,
    kawaiiTeethAcquired: teethCount > 0,
    actionCreated: actionCount > 0,
    totalResponses: responseCount,
  })
}
