export type UserRole = "system_admin" | "clinic_admin" | "staff"

/** Clinic.settings JSONB の型定義 */
export interface ClinicSettings {
  adminPassword?: string
  closedDates?: string[]
  openDates?: string[] // 定休日の営業日オーバーライド（定休日でも診療する日）
  regularClosedDays?: number[] // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  dailyTip?: {
    category: string
    title: string
    content: string
  }
  // アンケート完了後の誘導設定
  postSurveyAction?: "none" | "google_review" | "line" // デフォルト: "none"
  googleReviewUrl?: string // Google口コミ投稿ページURL
  lineUrl?: string // 医院LINE公式アカウントURL
  clinicHomepageUrl?: string // 医院ホームページURL（postSurveyActionとは独立して表示可能）
  // AI Advisory トラッキング
  advisoryThreshold?: number // アンロックに必要な回答数（デフォルト30）
  responsesSinceLastAdvisory?: number // 最終分析以降の新規回答数
}

/** アンケート完了後に表示するリンク情報 */
export interface PostSurveyLinks {
  googleReviewUrl?: string // Google口コミURL（postSurveyAction=google_review時のみ）
  lineUrl?: string // LINE URL（postSurveyAction=line時のみ）
  clinicHomepageUrl?: string // 医院HPリンク（独立して表示可能）
}

/** AI Advisory レポートのセクション型 */
export interface AdvisorySection {
  title: string
  content: string
  type:
    | "strength"
    | "improvement"
    | "action"
    | "trend"
    | "summary"
    | "correlation"
    | "first_revisit_gap"
    | "time_pattern"
    | "action_effect"
    | "distribution"
    | "business_correlation"
    | "seasonality"
}

/** AI Advisory レポートデータ */
export interface AdvisoryReportData {
  id: string
  triggerType: string
  responseCount: number
  sections: AdvisorySection[]
  summary: string
  priority: string | null
  generatedAt: string | Date
}

/** AI Advisory プログレスデータ */
export interface AdvisoryProgress {
  current: number       // 最終分析以降の回答数
  threshold: number     // アンロック閾値
  percentage: number    // 進捗率 0-100
  totalResponses: number // 全回答数
  lastReport: AdvisoryReportData | null
  canGenerate: boolean  // 手動生成可能か
  daysSinceLastReport: number | null
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
