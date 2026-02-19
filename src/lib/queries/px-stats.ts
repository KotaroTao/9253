import { prisma } from "@/lib/prisma"
import type { SegmentScores, SegmentDetail } from "@/types/px-value"

interface SegmentRow {
  segment: string
  avg_score: number
  weighted_avg_score: number
  response_count: bigint
}

/**
 * Compute segment-level analysis for a clinic.
 * Groups verified responses by patient segment (emergency, maintenance, highValue)
 * using CASE WHEN on patient_attributes JSONB.
 */
export async function getSegmentAnalysis(
  clinicId: string,
  days: number = 90
): Promise<SegmentScores> {
  const lookbackDate = new Date()
  lookbackDate.setDate(lookbackDate.getDate() - days)

  const rows = await prisma.$queryRaw<SegmentRow[]>`
    SELECT
      CASE
        -- New format (insuranceType + purpose)
        WHEN patient_attributes->>'purpose' = 'emergency' THEN 'emergency'
        WHEN patient_attributes->>'purpose' IN ('checkup', 'preventive') THEN 'maintenance'
        WHEN patient_attributes->>'insuranceType' = 'self_pay'
          AND patient_attributes->>'purpose' IN ('orthodontics', 'cosmetic', 'implant')
          THEN 'highValue'
        -- Legacy format (chiefComplaint + treatmentType)
        WHEN patient_attributes->>'chiefComplaint' = 'pain' THEN 'emergency'
        WHEN patient_attributes->>'treatmentType' = 'checkup'
          OR patient_attributes->>'chiefComplaint' = 'prevention' THEN 'maintenance'
        WHEN patient_attributes->>'chiefComplaint' IN ('orthodontics', 'cosmetic', 'denture_implant') THEN 'highValue'
        ELSE 'general'
      END AS segment,
      ROUND(AVG(overall_score)::numeric, 2)::float AS avg_score,
      ROUND(AVG(COALESCE(weighted_score, overall_score))::numeric, 2)::float AS weighted_avg_score,
      COUNT(*) AS response_count
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${lookbackDate}
      AND is_verified = true
      AND overall_score IS NOT NULL
      AND patient_attributes IS NOT NULL
    GROUP BY segment
  `

  const toDetail = (row: SegmentRow | undefined): SegmentDetail | null => {
    if (!row || Number(row.response_count) === 0) return null
    return {
      avgScore: row.avg_score,
      weightedAvgScore: row.weighted_avg_score,
      responseCount: Number(row.response_count),
    }
  }

  return {
    emergency: toDetail(rows.find((r) => r.segment === "emergency")),
    maintenance: toDetail(rows.find((r) => r.segment === "maintenance")),
    highValue: toDetail(rows.find((r) => r.segment === "highValue")),
  }
}
