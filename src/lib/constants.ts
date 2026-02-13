export const APP_NAME = "MIERU Clinic"
export const APP_DESCRIPTION = "患者体験の見える化"

export const ROLES = {
  SYSTEM_ADMIN: "system_admin",
  CLINIC_ADMIN: "clinic_admin",
  STAFF: "staff",
} as const

export const STAFF_ROLES = {
  DENTIST: "dentist",
  HYGIENIST: "hygienist",
  STAFF: "staff",
} as const

export const STAFF_ROLE_LABELS: Record<string, string> = {
  dentist: "歯科医師",
  hygienist: "歯科衛生士",
  staff: "スタッフ",
}

export const SURVEY_QUESTION_TYPES = {
  RATING: "rating",
  TEXT: "text",
} as const

export const DEFAULTS = {
  ITEMS_PER_PAGE: 20,
  CHART_MONTHS: 6,
  MAX_FREE_TEXT_LENGTH: 500,
  MIN_STAR_RATING: 1,
  MAX_STAR_RATING: 5,
  STAFF_SURVEY_MIN_RESPONSES: 5,
} as const

export const TALLY_TYPES = {
  NEW_PATIENT: "new_patient",
  MAINTENANCE_TRANSITION: "maintenance_transition",
  SELF_PAY_PROPOSAL: "self_pay_proposal",
  SELF_PAY_CONVERSION: "self_pay_conversion",
} as const

export type TallyType = (typeof TALLY_TYPES)[keyof typeof TALLY_TYPES]

export const TALLY_TYPE_LABELS: Record<string, string> = {
  new_patient: "新患",
  maintenance_transition: "メンテ移行",
  self_pay_proposal: "自費提案",
  self_pay_conversion: "自費成約",
}

export const ADMIN_MODE_COOKIE = "mieru-admin"
export const ADMIN_MODE_MAX_AGE = 60 * 60 * 8 // 8 hours

export const STAFF_SURVEY_CATEGORIES = {
  workEnvironment: "職場環境",
  relationships: "人間関係",
  fulfillment: "やりがい",
  growth: "成長・教育",
  compensation: "待遇・評価",
  management: "経営・方針",
} as const

export type StaffSurveyCategory = keyof typeof STAFF_SURVEY_CATEGORIES

export const STAFF_SURVEY_QUESTIONS = [
  { id: "es1", category: "workEnvironment" as const, text: "院内の設備・清潔さに満足している" },
  { id: "es2", category: "workEnvironment" as const, text: "業務量は適切だと感じる" },
  { id: "es3", category: "workEnvironment" as const, text: "勤務時間・シフトに無理がない" },
  { id: "es4", category: "workEnvironment" as const, text: "休憩時間が十分に確保されている" },
  { id: "es5", category: "relationships" as const, text: "スタッフ間のコミュニケーションは良好だ" },
  { id: "es6", category: "relationships" as const, text: "院長・上司に気軽に相談できる" },
  { id: "es7", category: "relationships" as const, text: "チームワークが良いと感じる" },
  { id: "es8", category: "relationships" as const, text: "不快な言動やハラスメントがない" },
  { id: "es9", category: "fulfillment" as const, text: "仕事にやりがいを感じている" },
  { id: "es10", category: "fulfillment" as const, text: "自分の役割・業務内容が明確だ" },
  { id: "es11", category: "fulfillment" as const, text: "患者さんに良い医療を提供できている" },
  { id: "es12", category: "growth" as const, text: "スキルアップの機会が十分にある" },
  { id: "es13", category: "growth" as const, text: "研修や勉強会に参加できている" },
  { id: "es14", category: "growth" as const, text: "キャリアの将来像を描けている" },
  { id: "es15", category: "compensation" as const, text: "給与・待遇に満足している" },
  { id: "es16", category: "compensation" as const, text: "自分の仕事が正当に評価されている" },
  { id: "es17", category: "compensation" as const, text: "福利厚生に満足している" },
  { id: "es18", category: "management" as const, text: "医院の方針やビジョンに共感できる" },
  { id: "es19", category: "management" as const, text: "業務改善の提案がしやすい環境だ" },
  { id: "es20", category: "management" as const, text: "この医院で長く働き続けたいと思う" },
] as const
