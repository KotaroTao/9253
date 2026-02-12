import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { staffSurveyCreateSchema } from "@/lib/validations/staff-survey"
import {
  createStaffSurvey,
  closeStaffSurvey,
  getStaffSurveys,
  getStaffSurveyResults,
  getActiveStaffSurvey,
} from "@/lib/queries/staff-surveys"

export async function GET() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const surveys = await getStaffSurveys(clinicId)
  return successResponse(surveys)
}

export async function POST(request: Request) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  // Check no active survey exists
  const activeSurvey = await getActiveStaffSurvey(clinicId)
  if (activeSurvey) {
    return errorResponse("実施中のサーベイがあります。先に締め切ってください。", 400)
  }

  const body = await request.json()
  const parsed = staffSurveyCreateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const survey = await createStaffSurvey(clinicId, parsed.data.title)
  return successResponse(survey, 201)
}

export async function PATCH(request: Request) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const body = await request.json()
  const { surveyId, action } = body

  if (action === "close" && surveyId) {
    const survey = await closeStaffSurvey(surveyId, clinicId)
    return successResponse(survey)
  }

  if (action === "results" && surveyId) {
    const results = await getStaffSurveyResults(surveyId, clinicId)
    if (!results) {
      return errorResponse(messages.staffSurvey.notFound, 404)
    }
    return successResponse(results)
  }

  return errorResponse(messages.errors.invalidInput, 400)
}
