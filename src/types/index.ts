export type UserRole = "system_admin" | "clinic_admin" | "staff"
export type StaffRole = "dentist" | "hygienist" | "staff"

export interface SurveyQuestion {
  id: string
  text: string
  type: "rating" | "text"
  required: boolean
}

export interface DashboardStats {
  totalResponses: number
  averageScore: number
  reviewClickRate: number
  reviewClickCount: number
  reviewRequestedCount: number
  recentResponses: RecentResponse[]
  staffRanking: StaffRankingEntry[]
}

export interface RecentResponse {
  id: string
  overallScore: number | null
  freeText: string | null
  reviewClicked: boolean
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

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
