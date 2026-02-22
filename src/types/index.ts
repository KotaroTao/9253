export type UserRole = "system_admin" | "clinic_admin" | "staff"

/** 料金プランティア */
export type PlanTier = "free" | "starter" | "standard" | "enterprise"

/** 診療科目タイプ（ベンチマーク基準切替用） */
export type ClinicType = "general" | "orthodontic" | "pediatric" | "cosmetic" | "oral_surgery" | "periodontal"

/** Clinic.settings JSONB の型定義 */
export interface ClinicSettings {
  clinicType?: ClinicType // 診療科目（ベンチマーク基準切替用。デフォルト: "general"）
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
  postSurveyAction?: "none" | "line" // デフォルト: "none"
  lineUrl?: string // 医院LINE公式アカウントURL
  clinicHomepageUrl?: string // 医院ホームページURL（postSurveyActionとは独立して表示可能）
  // AI Advisory トラッキング
  advisoryThreshold?: number // アンロックに必要な回答数（デフォルト30）
  responsesSinceLastAdvisory?: number // 最終分析以降の新規回答数
  // 料金プラン
  plan?: PlanTier // デフォルト: "free"
  trialPlan?: PlanTier // トライアル中のプラン
  trialStartedAt?: string // トライアル開始日 ISO8601
  trialEndsAt?: string // トライアル終了日 ISO8601
  trialUsed?: boolean // トライアル使用済みフラグ（再トライアル防止）
}

/** プラン情報（クライアント向け） */
export interface PlanInfo {
  plan: PlanTier
  effectivePlan: PlanTier
  isTrialActive: boolean
  trialDaysRemaining: number | null
  trialPlan: PlanTier | null
  canStartTrial: boolean
}

/** アンケート完了後に表示するリンク情報 */
export interface PostSurveyLinks {
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
    | "staff_performance"
    | "comment_themes"
    | "patient_segments"
    | "purpose_deep_dive"
    | "retention_signals"
    | "response_quality"
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
