import { NextRequest } from "next/server"
import { staffSurveySubmitSchema } from "@/lib/validations/staff-survey"
import { getStaffSurveyById, submitStaffSurveyResponse } from "@/lib/queries/staff-surveys"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getClientIp, hashIp } from "@/lib/ip"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp()
    const ipHash = hashIp(ip)
    const { allowed } = checkRateLimit(`staff-survey:${ipHash}`)
    if (!allowed) {
      return errorResponse(messages.survey.rateLimited, 429)
    }

    const body = await request.json()
    const parsed = staffSurveySubmitSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const { surveyId, answers, freeText } = parsed.data

    const survey = await getStaffSurveyById(surveyId)
    if (!survey) {
      return errorResponse(messages.staffSurvey.notFound, 404)
    }

    if (survey.status !== "active") {
      return errorResponse(messages.staffSurvey.expired, 400)
    }

    const response = await submitStaffSurveyResponse(surveyId, answers, freeText)

    return successResponse({ id: response.id })
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
