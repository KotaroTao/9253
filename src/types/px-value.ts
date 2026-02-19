export interface PxValueReport {
  pxValue: number
  trustAuthenticityRate: number
  stabilityScore: number
  pxRank: PxRankLabel
  rank: number
  totalClinics: number
  segmentScores: SegmentScores
  generatedAt: string
}

export type PxRankLabel = "SSS" | "S" | "A" | "B"

export interface SegmentScores {
  emergency: SegmentDetail | null
  maintenance: SegmentDetail | null
  highValue: SegmentDetail | null
}

export interface SegmentDetail {
  avgScore: number
  weightedAvgScore: number
  responseCount: number
}

export type PatientSegment = "emergency" | "maintenance" | "highValue" | "general"

export interface ClinicPxValue {
  clinicId: string
  pxValue: number
  weightedAvg: number
  responseCount: number
  trustAuthenticityRate: number
  rank: number
}
