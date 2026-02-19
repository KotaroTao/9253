import { NextRequest } from "next/server"
import { surveySubmissionSchema } from "@/lib/validations/survey"
import { getClinicBySlug, createSurveyResponse } from "@/lib/queries/surveys"
import { getClientIp, hashIp } from "@/lib/ip"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import { processSubmission } from "@/lib/services/px-value-engine"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = surveySubmissionSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400, {
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const {
      clinicSlug,
      staffId,
      templateId,
      answers,
      freeText,
      patientAttributes,
      responseDurationMs,
      deviceUuid,
    } = parsed.data

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

    // Verify staffId belongs to this clinic (if provided)
    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, clinicId: clinic.id, isActive: true },
        select: { id: true },
      })
      if (!staff) {
        return errorResponse(messages.errors.staffNotFound, 400)
      }
    }

    // IP hash for audit trail
    const ip = getClientIp()
    const ipHash = hashIp(ip)

    // Calculate overall score (raw arithmetic mean) from rating answers
    const ratingValues = Object.values(answers).filter(
      (v): v is number => typeof v === "number"
    )
    const overallScore =
      ratingValues.length > 0
        ? ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length
        : null

    // PX-Value engine: verification + weighted score
    const isKiosk = !!patientAttributes
    const pxResult = await processSubmission({
      clinicId: clinic.id,
      staffId: staffId ?? undefined,
      templateId,
      rawScore: overallScore ?? 0,
      questionCount: ratingValues.length,
      freeText,
      patientAttributes: patientAttributes ?? undefined,
      responseDurationMs,
      deviceUuid,
      isKiosk,
    })

    // Save response with PX-Value engine results
    const response = await createSurveyResponse({
      clinicId: clinic.id,
      staffId: staffId ?? undefined,
      templateId,
      answers,
      overallScore,
      weightedScore: pxResult.weightedScore,
      trustFactor: pxResult.trustFactor,
      isVerified: pxResult.isVerified,
      deviceType: pxResult.deviceType,
      responseDurationMs: responseDurationMs ?? null,
      freeText,
      patientAttributes: patientAttributes ?? undefined,
      ipHash,
    })

    return successResponse({ id: response.id }, 201)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
