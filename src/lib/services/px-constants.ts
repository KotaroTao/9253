import "server-only"

// ─── Speed Trap ───
/** Minimum milliseconds per question for a valid response */
export const SPEED_TRAP_MIN_MS_PER_QUESTION = 2000
/** Base question count for speed trap calculation */
export const SPEED_TRAP_BASE_QUESTIONS = 10

// ─── Continuity Trap ───
/** Window in milliseconds to detect rapid consecutive submissions */
export const CONTINUITY_TRAP_WINDOW_MS = 60_000

// ─── Capacity Trap ───
/** Maximum patients per dental unit per hour */
export const CAPACITY_FACTOR = 4
/** Time window in hours for capacity check */
export const CAPACITY_WINDOW_HOURS = 1

// ─── Similarity Trap ───
/** Jaccard bigram similarity threshold (0-1) */
export const SIMILARITY_THRESHOLD = 0.8
/** Number of recent free texts to compare against */
export const SIMILARITY_CHECK_COUNT = 50

// ─── Trust Factor Weights ───
export const TRUST_WEIGHTS = {
  speedTrap: 0.3,
  continuityTrap: 0.25,
  capacityTrap: 0.2,
  similarityTrap: 0.25,
} as const

// ─── Device Weights ───
export const DEVICE_WEIGHTS: Record<string, number> = {
  patient_url: 1.5,
  kiosk_authorized: 1.0,
  kiosk_unauthorized: 0.8,
} as const

// ─── Complaint / Purpose Weights ───
export const COMPLAINT_WEIGHTS: Record<string, number> = {
  // Current format (purpose values)
  emergency: 1.2,
  periodontal: 0.9,
  checkup_insurance: 0.9,
  self_pay_cleaning: 0.9,
  // Legacy format (old purpose values)
  checkup: 0.9,
  preventive: 0.9,
  // Legacy format (chiefComplaint values)
  pain: 1.2,
  prevention: 0.8,
} as const

export const DEFAULT_COMPLAINT_WEIGHT = 1.0

// ─── PX Rank Thresholds ───
export const PX_RANK_THRESHOLDS = [
  { min: 70, label: "SSS" as const },
  { min: 60, label: "S" as const },
  { min: 50, label: "A" as const },
  { min: -Infinity, label: "B" as const },
] as const

// ─── Batch Calculation ───
/** Minimum verified responses for a clinic to be included in PX-Value calculation */
export const PX_MIN_RESPONSES = 10
/** Days of data to consider for PX-Value */
export const PX_LOOKBACK_DAYS = 90
