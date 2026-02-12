import { NextRequest } from "next/server"
import { surveySubmissionSchema } from "@/lib/validations/survey"
import { getStaffByToken, createSurveyResponse, hasRecentSubmission } from "@/lib/queries/surveys"
import { getClientIp, hashIp } from "@/lib/ip"
import { checkRateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = surveySubmissionSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400, {
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const { staffToken, templateId, answers, freeText } = parsed.data

    // Verify staff + clinic
    const staff = await getStaffByToken(staffToken)
    if (!staff || !staff.clinic) {
      return errorResponse(messages.survey.invalidQr, 404)
    }

    // Verify template belongs to this clinic
    const template = staff.clinic.surveyTemplates.find(
      (t) => t.id === templateId
    )
    if (!template) {
      return errorResponse(messages.errors.invalidTemplate, 400)
    }

    // Rate limit by IP
    const ip = getClientIp()
    const ipHash = hashIp(ip)

    const rateLimit = checkRateLimit(ipHash)
    if (!rateLimit.allowed) {
      return errorResponse(messages.survey.rateLimited, 429)
    }

    // Check recent submission (same IP + same staff within 24h)
    const recentlySubmitted = await hasRecentSubmission(ipHash, staff.id)
    if (recentlySubmitted) {
      return errorResponse(messages.survey.alreadySubmitted, 429)
    }

    // Calculate overall score from rating answers
    const ratingValues = Object.values(answers).filter(
      (v): v is number => typeof v === "number"
    )
    const overallScore =
      ratingValues.length > 0
        ? ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length
        : null

    // Save response
    const response = await createSurveyResponse({
      clinicId: staff.clinic.id,
      staffId: staff.id,
      templateId,
      answers,
      overallScore,
      freeText,
      ipHash,
    })

    return successResponse({ id: response.id })
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
