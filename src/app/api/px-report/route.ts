import { NextRequest } from "next/server"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import {
  calculateAllPxValues,
  calculateStabilityScore,
  getPxRank,
} from "@/lib/services/px-value-engine"
import { getSegmentAnalysis } from "@/lib/queries/px-stats"
import type { PxValueReport } from "@/types/px-value"

export async function GET(request: NextRequest) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result
  const clinicId =
    request.nextUrl.searchParams.get("clinicId") ?? user.clinicId

  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  // Only system_admin can view other clinics' reports
  if (clinicId !== user.clinicId && user.role !== "system_admin") {
    return errorResponse(messages.errors.accessDenied, 403)
  }

  try {
    // Check for cached PX values
    const cached = await prisma.platformSetting.findUnique({
      where: { key: "px_values_latest" },
    })

    let pxValue = 50
    let rank = 1
    let totalClinics = 1
    let trustAuthenticityRate = 100

    if (cached?.value) {
      const cachedValues = cached.value as Array<{
        clinicId: string
        pxValue: number
        rank: number
        trustAuthenticityRate: number
      }>
      totalClinics = cachedValues.length
      const clinicData = cachedValues.find((c) => c.clinicId === clinicId)
      if (clinicData) {
        pxValue = clinicData.pxValue
        rank = clinicData.rank
        trustAuthenticityRate = clinicData.trustAuthenticityRate
      }
    } else {
      // Calculate on demand if no cache exists
      const allValues = await calculateAllPxValues()
      totalClinics = allValues.length
      const clinicData = allValues.find((c) => c.clinicId === clinicId)
      if (clinicData) {
        pxValue = clinicData.pxValue
        rank = clinicData.rank
        trustAuthenticityRate = clinicData.trustAuthenticityRate
      }
    }

    const stabilityScore = await calculateStabilityScore(clinicId)
    const segmentScores = await getSegmentAnalysis(clinicId, 90)

    const report: PxValueReport = {
      pxValue,
      trustAuthenticityRate,
      stabilityScore,
      pxRank: getPxRank(pxValue),
      rank,
      totalClinics,
      segmentScores,
      generatedAt: new Date().toISOString(),
    }

    return successResponse(report)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
