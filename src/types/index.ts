export type UserRole = "system_admin" | "clinic_admin" | "staff"


export interface RecentResponse {
  id: string
  overallScore: number | null
  freeText: string | null
  respondedAt: Date | string
  staff: {
    name: string
    role: string
  }
}

export interface StaffRankingEntry {
  staffId: string
  name: string
  role: string
  avgScore: number
  responseCount: number
}

export interface MonthlyTrend {
  month: string
  avgScore: number
  count: number
}

export interface StaffWithStats {
  id: string
  name: string
  role: string
  qrToken: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
  surveyCount: number
  avgScore: number
}

export interface StaffSurveySummary {
  id: string
  title: string
  status: string
  startsAt: Date | string
  endsAt: Date | string | null
  responseCount: number
  overallScore: number | null
}

export interface StaffSurveyCategoryScore {
  category: string
  label: string
  score: number
}

export interface StaffSurveyResult {
  id: string
  title: string
  status: string
  responseCount: number
  overallScore: number | null
  categoryScores: StaffSurveyCategoryScore[]
  freeTexts: string[]
}

export interface StaffTallyMetrics {
  staffId: string
  name: string
  role: string
  newPatientCount: number
  maintenanceTransitionCount: number
  selfPayProposalCount: number
  selfPayConversionCount: number
  maintenanceRate: number | null
  selfPayRate: number | null
}

export interface FourMetricsTrend {
  month: string
  patientSatisfaction: number | null
  employeeSatisfaction: number | null
  maintenanceRate: number | null
  selfPayRate: number | null
}
