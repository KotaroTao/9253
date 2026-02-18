export type UserRole = "system_admin" | "clinic_admin" | "staff"

/** Clinic.settings JSONB の型定義 */
export interface ClinicSettings {
  adminPassword?: string
  dailyGoal?: number
  closedDates?: string[]
  openDates?: string[] // 定休日の営業日オーバーライド（定休日でも診療する日）
  regularClosedDays?: number[] // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  dailyTip?: {
    category: string
    title: string
    content: string
  }
}


export interface RecentResponse {
  id: string
  overallScore: number | null
  freeText: string | null
  respondedAt: Date | string
  staff: {
    name: string
    role: string
  } | null
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
}

export interface SatisfactionTrend {
  month: string
  patientSatisfaction: number | null
}
