import { NextRequest } from "next/server"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { ADVISORY } from "@/lib/constants"
import { logger } from "@/lib/logger"
import {
  getAdvisoryProgress,
  getAdvisoryReports,
  generateAdvisoryReport,
} from "@/lib/queries/advisory"

/** LLM分析に時間がかかるため、ルートの最大実行時間を延長 */
export const maxDuration = 120

/**
 * GET /api/advisory — プログレス情報とレポート一覧を取得
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const { searchParams } = request.nextUrl
  const includeReports = searchParams.get("reports") === "true"

  const progress = await getAdvisoryProgress(clinicId)

  if (includeReports) {
    const reports = await getAdvisoryReports(clinicId)
    return successResponse({ progress, reports })
  }

  return successResponse({ progress })
}

/**
 * POST /api/advisory — 手動でAI分析を実行
 */
export async function POST() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const role = authResult.user.role
  if (role !== "clinic_admin" && role !== "system_admin") {
    return errorResponse(messages.errors.accessDenied, 403)
  }

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  // 最低限のデータがあるかチェック
  const progress = await getAdvisoryProgress(clinicId)
  if (progress.totalResponses < ADVISORY.MIN_RESPONSES_FOR_FIRST) {
    return errorResponse(
      messages.advisory.insufficientData.replace("{min}", String(ADVISORY.MIN_RESPONSES_FOR_FIRST)),
      400
    )
  }

  try {
    const report = await generateAdvisoryReport(clinicId, "manual")
    return successResponse({ report }, 201)
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    // Cloud Runログに確実に出力
    console.error("[advisory-api] generateAdvisoryReport failed:", detail, e instanceof Error ? e.stack : "")
    logger.error("Advisory report generation failed", {
      component: "advisory-api",
      clinicId,
      error: detail,
      stack: e instanceof Error ? e.stack : undefined,
    })
    return errorResponse(messages.advisory.generateFailed, 500, { detail })
  }
}
