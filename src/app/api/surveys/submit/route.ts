import { NextRequest } from "next/server"
import { surveySubmissionSchema } from "@/lib/validations/survey"
import { getClinicBySlug, createSurveyResponse } from "@/lib/queries/surveys"
import { getClientIp, hashIp } from "@/lib/ip"
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

    const { clinicSlug, templateId, answers, freeText, patientAttributes } = parsed.data

    // Verify clinic
    const clinic = await getClinicBySlug(clinicSlug)
    if (!clinic) {
      return errorResponse(messages.survey.invalidLink, 404)
    }

    // Verify template belongs to this clinic
    const template = clinic.surveyTemplates.find(
      (t) => t.id === templateId
    )
    if (!template) {
      return errorResponse(messages.errors.invalidTemplate, 400)
    }

    // IP hash for audit trail only (no blocking)
    const ip = getClientIp()
    const ipHash = hashIp(ip)

    // Calculate overall score from rating answers
    const ratingValues = Object.values(answers).filter(
      (v): v is number => typeof v === "number"
    )
    const overallScore =
      ratingValues.length > 0
        ? ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length
        : null

    // Save response (clinic-level, no staff tracking)
    const response = await createSurveyResponse({
      clinicId: clinic.id,
      templateId,
      answers,
      overallScore,
      freeText,
      patientAttributes: patientAttributes ?? undefined,
      ipHash,
    })

    return successResponse({ id: response.id })
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
