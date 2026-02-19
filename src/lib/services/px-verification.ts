import "server-only"

import { prisma } from "@/lib/prisma"
import {
  SPEED_TRAP_MIN_MS_PER_QUESTION,
  CONTINUITY_TRAP_WINDOW_MS,
  CAPACITY_FACTOR,
  CAPACITY_WINDOW_HOURS,
  SIMILARITY_THRESHOLD,
  SIMILARITY_CHECK_COUNT,
  TRUST_WEIGHTS,
} from "./px-constants"

// ─── Types ───

export interface VerificationInput {
  clinicId: string
  staffId?: string
  deviceType?: string
  responseDurationMs?: number
  questionCount: number
  freeText?: string
  respondedAt: Date
}

export interface VerificationResult {
  isVerified: boolean
  trustFactor: number
  checks: {
    speedTrap: boolean
    continuityTrap: boolean
    capacityTrap: boolean
    similarityTrap: boolean
  }
}

// ─── Bigram Jaccard Similarity (language-agnostic for Japanese text) ───

function bigramSet(text: string): Set<string> {
  const normalized = text.replace(/\s+/g, "")
  const s = new Set<string>()
  for (let i = 0; i < normalized.length - 1; i++) {
    s.add(normalized.substring(i, i + 2))
  }
  return s
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = bigramSet(a)
  const setB = bigramSet(b)
  if (setA.size === 0 && setB.size === 0) return 0
  let intersection = 0
  setA.forEach((bigram) => {
    if (setB.has(bigram)) intersection++
  })
  const union = setA.size + setB.size - intersection
  return union > 0 ? intersection / union : 0
}

// ─── Individual Trap Checks ───

function checkSpeedTrap(input: VerificationInput): boolean {
  if (input.responseDurationMs == null) return true
  const minDuration = input.questionCount * SPEED_TRAP_MIN_MS_PER_QUESTION
  return input.responseDurationMs >= minDuration
}

async function checkContinuityTrap(input: VerificationInput): Promise<boolean> {
  if (!input.staffId && !input.deviceType) return true

  const windowStart = new Date(
    input.respondedAt.getTime() - CONTINUITY_TRAP_WINDOW_MS
  )

  const where: Record<string, unknown> = {
    clinicId: input.clinicId,
    respondedAt: { gte: windowStart, lt: input.respondedAt },
  }
  if (input.staffId) where.staffId = input.staffId
  if (input.deviceType) where.deviceType = input.deviceType

  const recentCount = await prisma.surveyResponse.count({ where })
  return recentCount === 0
}

async function checkCapacityTrap(input: VerificationInput): Promise<boolean> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: input.clinicId },
    select: { unitCount: true },
  })

  if (!clinic?.unitCount) return true

  const windowStart = new Date(
    input.respondedAt.getTime() - CAPACITY_WINDOW_HOURS * 60 * 60 * 1000
  )

  const recentCount = await prisma.surveyResponse.count({
    where: {
      clinicId: input.clinicId,
      respondedAt: { gte: windowStart },
    },
  })

  const maxCapacity = clinic.unitCount * CAPACITY_FACTOR
  return recentCount < maxCapacity
}

async function checkSimilarityTrap(
  input: VerificationInput
): Promise<boolean> {
  if (!input.freeText || input.freeText.trim().length < 5) return true

  const recentTexts = await prisma.surveyResponse.findMany({
    where: {
      clinicId: input.clinicId,
      freeText: { not: null },
    },
    select: { freeText: true },
    orderBy: { respondedAt: "desc" },
    take: SIMILARITY_CHECK_COUNT,
  })

  for (const row of recentTexts) {
    if (!row.freeText) continue
    const similarity = jaccardSimilarity(input.freeText, row.freeText)
    if (similarity >= SIMILARITY_THRESHOLD) {
      return false
    }
  }

  return true
}

// ─── Main Verification Function ───

export async function verifySubmission(
  input: VerificationInput
): Promise<VerificationResult> {
  const [speedOk, continuityOk, capacityOk, similarityOk] = await Promise.all([
    Promise.resolve(checkSpeedTrap(input)),
    checkContinuityTrap(input),
    checkCapacityTrap(input),
    checkSimilarityTrap(input),
  ])

  const trustFactor =
    (speedOk ? TRUST_WEIGHTS.speedTrap : 0) +
    (continuityOk ? TRUST_WEIGHTS.continuityTrap : 0) +
    (capacityOk ? TRUST_WEIGHTS.capacityTrap : 0) +
    (similarityOk ? TRUST_WEIGHTS.similarityTrap : 0)

  const isVerified = speedOk && continuityOk && capacityOk && similarityOk

  return {
    isVerified,
    trustFactor: Math.round(trustFactor * 100) / 100,
    checks: {
      speedTrap: speedOk,
      continuityTrap: continuityOk,
      capacityTrap: capacityOk,
      similarityTrap: similarityOk,
    },
  }
}
