import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import {
  calculateAllPxValues,
  calculateStabilityScore,
  getPxRank,
} from "@/lib/services/px-value-engine"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const clinicPxValues = await calculateAllPxValues()

    // Fetch clinic names for display
    const clinicIds = clinicPxValues.map((c) => c.clinicId)
    const clinics =
      clinicIds.length > 0
        ? await prisma.clinic.findMany({
            where: { id: { in: clinicIds } },
            select: { id: true, name: true, slug: true },
          })
        : []
    const clinicMap = new Map(clinics.map((c) => [c.id, c]))

    // Calculate stability scores in parallel
    const stabilityScores = await Promise.all(
      clinicPxValues.map((c) => calculateStabilityScore(c.clinicId))
    )

    const results = clinicPxValues.map((pxv, i) => {
      const clinic = clinicMap.get(pxv.clinicId)
      return {
        clinicId: pxv.clinicId,
        clinicName: clinic?.name ?? "不明",
        clinicSlug: clinic?.slug ?? "",
        pxValue: pxv.pxValue,
        pxRank: getPxRank(pxv.pxValue),
        weightedAvg: pxv.weightedAvg,
        responseCount: pxv.responseCount,
        trustAuthenticityRate: pxv.trustAuthenticityRate,
        stabilityScore: stabilityScores[i],
        rank: pxv.rank,
      }
    })

    return successResponse({
      clinics: results,
      totalClinics: results.length,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return errorResponse("PX-Valueの計算に失敗しました", 500)
  }
}
