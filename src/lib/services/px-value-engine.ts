import "server-only"

import { prisma } from "@/lib/prisma"
import { verifySubmission } from "./px-verification"
import type { VerificationInput } from "./px-verification"
import {
  DEVICE_WEIGHTS,
  COMPLAINT_WEIGHTS,
  DEFAULT_COMPLAINT_WEIGHT,
  PX_RANK_THRESHOLDS,
  PX_MIN_RESPONSES,
  PX_LOOKBACK_DAYS,
} from "./px-constants"
import type { ClinicPxValue, PxRankLabel } from "@/types/px-value"

// ─── Submission-Time Processing ───

export interface ProcessSubmissionInput {
  clinicId: string
  staffId?: string
  templateId: string
  rawScore: number
  questionCount: number
  freeText?: string
  patientAttributes?: { chiefComplaint?: string; treatmentType?: string }
  responseDurationMs?: number
  deviceUuid?: string
  isKiosk: boolean
}

export interface ProcessSubmissionResult {
  weightedScore: number
  trustFactor: number
  isVerified: boolean
  deviceType: string
}

/**
 * Process a survey submission: determine device type, run verification checks,
 * and compute the weighted score.
 */
export async function processSubmission(
  input: ProcessSubmissionInput
): Promise<ProcessSubmissionResult> {
  // 1. Determine device type
  let deviceType: string
  if (!input.isKiosk) {
    deviceType = "patient_url"
  } else if (input.deviceUuid) {
    const device = await prisma.authorizedDevice.findUnique({
      where: { deviceUuid: input.deviceUuid },
      select: { isAuthorized: true },
    })
    deviceType = device?.isAuthorized
      ? "kiosk_authorized"
      : "kiosk_unauthorized"
  } else {
    deviceType = "kiosk_unauthorized"
  }

  // 2. Run verification
  const verificationInput: VerificationInput = {
    clinicId: input.clinicId,
    staffId: input.staffId,
    deviceType,
    responseDurationMs: input.responseDurationMs,
    questionCount: input.questionCount,
    freeText: input.freeText,
    respondedAt: new Date(),
  }
  const verification = await verifySubmission(verificationInput)

  // 3. Calculate weighted score
  const deviceWeight = DEVICE_WEIGHTS[deviceType] ?? 1.0
  const complaintWeight =
    COMPLAINT_WEIGHTS[input.patientAttributes?.chiefComplaint ?? ""] ??
    DEFAULT_COMPLAINT_WEIGHT
  const weightedScore =
    Math.round(input.rawScore * deviceWeight * complaintWeight * 100) / 100

  return {
    weightedScore,
    trustFactor: verification.trustFactor,
    isVerified: verification.isVerified,
    deviceType,
  }
}

// ─── PX Rank Helper ───

export function getPxRank(pxValue: number): PxRankLabel {
  for (const tier of PX_RANK_THRESHOLDS) {
    if (pxValue >= tier.min) return tier.label
  }
  return "B"
}

// ─── Batch PX-Value Calculation ───

interface ClinicAvgRow {
  clinic_id: string
  weighted_avg: number
  response_count: bigint
  verified_count: bigint
  total_count: bigint
}

/**
 * Calculate PX-Values (T-Scores) for all clinics with sufficient data.
 * Uses verified responses from the last N days.
 */
export async function calculateAllPxValues(): Promise<ClinicPxValue[]> {
  const lookbackDate = new Date()
  lookbackDate.setDate(lookbackDate.getDate() - PX_LOOKBACK_DAYS)

  const rows = await prisma.$queryRaw<ClinicAvgRow[]>`
    SELECT
      clinic_id,
      ROUND(AVG(COALESCE(weighted_score, overall_score))
        FILTER (WHERE is_verified = true)::numeric, 3)::float AS weighted_avg,
      COUNT(*) FILTER (WHERE is_verified = true) AS response_count,
      COUNT(*) FILTER (WHERE is_verified = true) AS verified_count,
      COUNT(*) AS total_count
    FROM survey_responses
    WHERE responded_at >= ${lookbackDate}
      AND overall_score IS NOT NULL
    GROUP BY clinic_id
    HAVING COUNT(*) FILTER (WHERE is_verified = true) >= ${PX_MIN_RESPONSES}
  `

  if (rows.length < 2) {
    return rows.map((r) => ({
      clinicId: r.clinic_id,
      pxValue: 50,
      weightedAvg: r.weighted_avg,
      responseCount: Number(r.response_count),
      trustAuthenticityRate:
        Number(r.total_count) > 0
          ? Math.round(
              (Number(r.verified_count) / Number(r.total_count)) * 1000
            ) / 10
          : 100,
      rank: 1,
    }))
  }

  // Compute global mean and standard deviation
  const avgs = rows.map((r) => r.weighted_avg)
  const globalMean = avgs.reduce((a, b) => a + b, 0) / avgs.length
  const variance =
    avgs.reduce((sum, v) => sum + (v - globalMean) ** 2, 0) / avgs.length
  const globalStdDev = Math.sqrt(variance)

  // T-Score = 50 + 10 * (clinic_avg - global_mean) / global_std_dev
  const results: ClinicPxValue[] = rows.map((r) => ({
    clinicId: r.clinic_id,
    pxValue:
      globalStdDev > 0
        ? Math.round(
            (50 + (10 * (r.weighted_avg - globalMean)) / globalStdDev) * 10
          ) / 10
        : 50,
    weightedAvg: r.weighted_avg,
    responseCount: Number(r.response_count),
    trustAuthenticityRate:
      Number(r.total_count) > 0
        ? Math.round(
            (Number(r.verified_count) / Number(r.total_count)) * 1000
          ) / 10
        : 100,
    rank: 0,
  }))

  // Assign ranks (higher pxValue = better rank = lower number)
  results.sort((a, b) => b.pxValue - a.pxValue)
  results.forEach((r, i) => {
    r.rank = i + 1
  })

  return results
}

// ─── Stability Score ───

interface DayAvgRow {
  avg_score: number
}

/**
 * Calculate stability score for a clinic based on daily score volatility.
 * Returns 0-100 where higher = more stable.
 */
export async function calculateStabilityScore(
  clinicId: string
): Promise<number> {
  const lookbackDate = new Date()
  lookbackDate.setDate(lookbackDate.getDate() - PX_LOOKBACK_DAYS)

  const rows = await prisma.$queryRaw<DayAvgRow[]>`
    SELECT
      ROUND(AVG(COALESCE(weighted_score, overall_score))::numeric, 3)::float AS avg_score
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${lookbackDate}
      AND is_verified = true
      AND overall_score IS NOT NULL
    GROUP BY (responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date
    HAVING COUNT(*) >= 1
  `

  if (rows.length < 7) return 50

  const scores = rows.map((r) => r.avg_score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance =
    scores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / scores.length
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0

  // CV of 0 → 100 stability, CV of 0.5+ → 0 stability
  return Math.max(0, Math.min(100, Math.round((1 - cv * 2) * 100)))
}
